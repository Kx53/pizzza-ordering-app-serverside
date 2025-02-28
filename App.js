const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const md5 = require('md5');
const jwt = require("jsonwebtoken");
const cors = require('cors');
const uniqid = require("uniqid");
const mariadb = require("mariadb");
const port = 3307;
const moment = require('moment');
const fs = require('fs');
const axios = require('axios');
const expressWs = require("express-ws");
// const app = expressWs(express()).app;
const app = express();


const db = mariadb.createPool({
    host: '192.168.0.133',
    port: '3306',
    user: 'root',
    password: 'casaos',
    database: 'pizza_ordering_app',
    connectionLimit: 5
});

// const db = await pool.getConnection(); 
db.getConnection(err => {
  if (err) throw err;
  console.log('Database connected!');
});

const corsOptions ={
    origin: "*", 
    // origin: ["http://localhost:3000", "https://smkconnectplus.online"], 
    method: ["GET", "POST"],
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}

app.use(express.json({ limit: '20mb' }));
app.use(cors(corsOptions));
// app.use(cookieParser());
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));


const secretKey = 'pizza-eiei';


app.get('/SessionAuth/:SessionID', async(req, res) => {
    const SessionID = req.params.SessionID;
    let data = {
        Status: false,
        Results: {}
    }
    try {
        const FindTableInSession = `SELECT customer_in_session.*, AllTable.* FROM customer_in_session JOIN AllTable ON AllTable.tb_key = customer_in_session.cis_table_key WHERE customer_in_session.cis_session_id = ? AND customer_in_session.cis_status = ? LIMIT 1`;
        const FindTableInSessionResults = await db.query(FindTableInSession, [SessionID, 'in-process']);
        if(FindTableInSessionResults.length > 0){
            data.Results = FindTableInSessionResults[0];
            data.Status = true;
            console.log(FindTableInSessionResults);
        }
        res.status(200).json(data);  
    } catch (error) {
        console.error(error);
        res.status(200).json(data);  
    }
});

app.post('/QRCodeGenerator', async(req, res) => {
    const TableKey = req.body.TableKey;
    let data = {
        Status: false,
        Results: {

        }
    }
    try {
        const FindTableInSession = `SELECT * FROM customer_in_session WHERE cis_table_key = ? AND cis_status = ? LIMIT 1`;
        const results = await db.query(FindTableInSession, [TableKey, 'in-process']);
        if(results.length > 0){
            data.Results = results[0];
            data.Status = true;
        } else{
            const GenerateSessionId = `SID-${uniqid()}`;
            const DateTime = moment().format("YYYY-MM-DD HH:mm:ss");
            const CreateNewSession = `INSERT INTO customer_in_session (cis_session_id, cis_table_key, cis_datetime, cis_status, cis_table_total) VALUES (?, ?, ?, ?, ?)`;
            const CreateNewSessionResults = await db.query(CreateNewSession, [GenerateSessionId, TableKey, DateTime, 'in-process', 0]);
            if(CreateNewSessionResults.affectedRows > 0){
                data.Results = {
                    cis_session_id: GenerateSessionId,
                    cis_table_key: TableKey,
                    cis_datetime: DateTime,
                    cis_status: 'in-process'
                };
                data.Status = true;
            }
        }
        res.status(200).json(data);  
    } catch (error) {
        console.error(error);
    }

});

app.get('/AllTable', async(req, res) => {
    let data = {
        Status: false,
        Results: []
    }
    try {
        const SelectTable = `SELECT tb_name, tb_key FROM AllTable`;
        const results = await db.query(SelectTable);
        if(results.length > 0){
            data.Results = results;
            data.Status = true;
        }
        res.status(200).json(data);  
    } catch (error) {
        console.error(error);
        res.status(200).json(data);  
    }

});

app.get('/AllMenu', async(req, res) => {
    let data = {
        Status: false,
        Results: []
    }
    try {
        const AllMenuList = `SELECT * FROM product_list`;
        const results = await db.query(AllMenuList);
        if(results.length > 0){
            const ReusltLoop = results.map((List, i) => {
                const imagePath = path.join(__dirname, List.p_image_path);
                return new Promise((resolve, reject) => {
                    fs.readFile(imagePath, (err, data) => {
                        if (err) {
                            results[i].FoodImage = null;
                        }
        
                        if (data) {
                            const base64Image = `data:image/png;base64, ${data.toString('base64')}`;
                            console.log(data);
                            results[i].FoodImage = base64Image;
                        }
                        resolve();
                    });
                });
            });
        
            await Promise.all(ReusltLoop);
            data.Results = results;
            data.Status = true;
        }
        res.status(200).json(data);  
    } catch (error) {
        console.error(error);
        res.status(200).json(data);  
    }

});


// app.get('/AllMenu', async (req, res) => {
//     let data = {
//         Status: false,
//         Results: []
//     };

//     try {
//         const AllMenuList = `SELECT * FROM product_list`;
//         const results = await db.query(AllMenuList);

//         if (results.length > 0) {
//             const ResultLoop = results.map(async (List, i) => {
//                 try {
//                     const imagePath = path.join(__dirname, List.p_image_path);
//                     const imageData = await fs.promises.readFile(imagePath);
//                     const base64Image = `data:image/jpeg;base64,${Buffer.from(imageData).toString('base64')}`;
//                     List.FoodImage = base64Image;
//                 } catch (err) {
//                     console.error(`Error reading image for ${List.p_image_path}:`, err);
//                     List.FoodImage = null; // Optionally set a default value
//                 }
//             });

//             await Promise.all(ResultLoop);
//             data.Results = results;
//             data.Status = true;
//         }

//         res.status(200).json(data);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json(data); // Set status to 500 for server error
//     }
// });


app.get('/MyOrder/:SessionID', async(req, res) => {
    let SessionID = req.params.SessionID;
    let data = {
        Status: false,
        Results: []
    }
    try {
        const AllOrderList = `SELECT * FROM order_list WHERE o_session_id = ? AND o_states != ? ORDER BY o_id DESC`;
        const results = await db.query(AllOrderList, [SessionID, 'order']);
        if(results.length > 0){
            data.Results = results;
            data.Status = true;
        }
        res.status(200).json(data);  
    } catch (error) {
        console.error(error);
        res.status(200).json(data);  
    }
});

app.get('/InOrderShow/:OrderKey', async(req, res) => {
    let OrderKey = req.params.OrderKey;
    let data = {
        Status: false,
        Results: {
            OrderKey: '',
            OrderInfo: {},
            Lists: []
        }
    }
    try {
        const OrderInfo = `SELECT * FROM order_list WHERE o_order_key = ?`;
        const OrderInfoResult = await db.query(OrderInfo, [OrderKey]);
        const InOrderLists = `SELECT order_detail.*, product_list.* FROM order_detail JOIN product_list ON order_detail.od_product_key = product_list.p_product_key WHERE order_detail.od_order_key = ?`;
        const results = await db.query(InOrderLists, [OrderKey]);
        if(results.length > 0 && OrderInfoResult.length > 0){
            data.Results.OrderKey = OrderKey;
            data.Results.OrderInfo = OrderInfoResult[0];
            data.Results.Lists = results;
            data.Status = true;
            console.log(data);
        }
        res.status(200).json(data);  
    } catch (error) {
        console.error(error);
        res.status(200).json(data);  
    }
});

app.get('/ViewCurrentlyCart/:SessionID', async(req, res) => {
    let SessionID = req.params.SessionID;
    let data = {
        Status: false,
        Results: {
            OrderInfo: {},
            Lists: []
        }
    }
    try {
        const ViewCurrentlyCart = `SELECT * FROM order_list WHERE o_session_id = ? AND o_states = ? ORDER BY o_id DESC LIMIT 1`;
        const ViewCurrentlyCartResult = await db.query(ViewCurrentlyCart, [SessionID, 'order']);
        if(ViewCurrentlyCartResult.length > 0){
            const ItemInViewCurrentlyCart = `SELECT order_detail.*, product_list.* FROM order_detail JOIN product_list ON order_detail.od_product_key = product_list.p_product_key WHERE order_detail.od_order_key = ?`;
            const ItemInViewCurrentlyCartResult = await db.query(ItemInViewCurrentlyCart, [ViewCurrentlyCartResult[0].o_order_key]);
            if(ItemInViewCurrentlyCartResult.length > 0){
                const ReusltLoop = ItemInViewCurrentlyCartResult.map((List, i) => {
                    const imagePath = path.join(__dirname, List.p_image_path);
                    return new Promise((resolve, reject) => {
                        fs.readFile(imagePath, (err, data) => {
                            if (err) {
                                ItemInViewCurrentlyCartResult[i].FoodImage = null;
                            }
            
                            if (data) {
                                const base64Image = `data:image/png;base64, ${data.toString('base64')}`;
                                console.log(data);
                                ItemInViewCurrentlyCartResult[i].FoodImage = base64Image;
                            }
                            resolve();
                        });
                    });
                });
            
                await Promise.all(ReusltLoop);
                data.Results.OrderInfo = ViewCurrentlyCartResult[0];
                data.Results.Lists = ItemInViewCurrentlyCartResult;
            }
        }
        data.Status = true;
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(200).json(data);
    }
});



app.post('/AddToCart', async(req, res) => {
    const DataFromUser = req.body;
    console.log(DataFromUser.ProductKey);
    let data = {
        Status: false,
        Results: []
    }
    try {
        if(!DataFromUser.ProductKey || !DataFromUser.SessionID){
            res.status(200).json(data); 
        } else{
            const ProductInfo = `SELECT * FROM product_list WHERE p_product_key = ?`;
            const ProductInfoResult = await db.query(ProductInfo, [DataFromUser.ProductKey]);
            if(ProductInfoResult.length > 0){
                const OrderStatusCheck = `SELECT * FROM order_list WHERE o_session_id = ? AND o_states = ? LIMIT 1`;
                const OrderStatusCheckResult = await db.query(OrderStatusCheck, [DataFromUser.SessionID, 'order']);
                if(OrderStatusCheckResult.length > 0){

                    const ItemInCartCheckExist = `SELECT * FROM order_detail WHERE od_order_key = ? AND od_product_key = ?`;
                    const ItemInCartCheckExistResult = await db.query(ItemInCartCheckExist, [OrderStatusCheckResult[0].o_order_key, DataFromUser.ProductKey]);

                    if(ItemInCartCheckExistResult.length > 0){
                        const ReQuantity = ItemInCartCheckExistResult[0].od_quantity + 1;
                        const ReSubTotal = ReQuantity * ItemInCartCheckExistResult[0].od_price;
                        const UpdateQuantityInCart = `UPDATE order_detail SET od_quantity = ?, od_subtotal = ? WHERE od_order_key = ? AND od_product_key = ?`;
                        const UpdateQuantityInCartResult = await db.query(UpdateQuantityInCart, [ReQuantity, ReSubTotal, OrderStatusCheckResult[0].o_order_key, ItemInCartCheckExistResult[0].od_product_key]);
                        if(UpdateQuantityInCartResult.affectedRows > 0){
                            data.Status = true;
                            data.Results = ['เพิ่มสำเร็จ'];
                        }
                    } else{
                        const AddNewListInOrder = `INSERT INTO order_detail (od_order_key, od_product_key, od_name, od_price, od_quantity, od_subtotal) `+
                        `VALUES (?, ?, ?, ?, ?, ?)`;
                        const AddNewOrderListResult = await db.query(AddNewListInOrder, 
                            [OrderStatusCheckResult[0].o_order_key, ProductInfoResult[0].p_product_key, ProductInfoResult[0].p_name, ProductInfoResult[0].p_price, 1, ProductInfoResult[0].p_price]);
                        if(AddNewOrderListResult.affectedRows > 0){
                            data.Status = true;
                            data.Results = ['เพิ่มสำเร็จ'];
                        }
                    }

                

                } else{
                    const OrderGeneratedKey = 'PZZ-'+uniqid();
                    const AddNewOrderList = `INSERT INTO order_list (o_session_id, o_order_key, o_total, o_states) `+
                    `VALUES (?, ?, ?, ?)`;
                    const AddNewOrderListResult = await db.query(AddNewOrderList, [DataFromUser.SessionID, OrderGeneratedKey, 0, 'order']);
                    if(AddNewOrderListResult.affectedRows > 0){
                        const AddNewListInOrder = `INSERT INTO order_detail (od_order_key, od_product_key, od_name, od_price, od_quantity, od_subtotal) `+
                        `VALUES (?, ?, ?, ?, ?, ?)`;
                        const AddNewOrderListResult = await db.query(AddNewListInOrder, 
                            [OrderGeneratedKey, ProductInfoResult[0].p_product_key, ProductInfoResult[0].p_name, ProductInfoResult[0].p_price, 1, ProductInfoResult[0].p_price]);
                        if(AddNewOrderListResult.affectedRows > 0){
                            data.Status = true;
                            data.Results = ['เพิ่มสำเร็จ'];
                        }
                    }
                }
            }
            res.status(200).json(data);  
        }
    } catch(error) {
        console.error(error);
        res.status(200).json(data);  
    }
});


app.get('/DeleteItemInCart/:ProductKey', async(req, res) => {
    const ProductKey = req.params.ProductKey;
    let data = {
        Status: false,
        Results: []
    }
    try{
        const DeleteItemInCart = `DELETE FROM order_detail WHERE od_product_key = ?`;
        const DeleteItemInCartResult = await db.query(DeleteItemInCart, [ProductKey]);
        if(DeleteItemInCartResult.affectedRows > 0){
            data.Status = true;
            data.Results = ['ลบสำเร็จ'];
        }
    } catch(error){
        console.log(error);
    }
    res.status(200).json(data);  
});

app.get('/OrderStatesChange/:OrderKey/:States', async(req, res) => {
    const States = req.params.States;
    const OrderKey = req.params.OrderKey;
    let data = {
        Status: false,
        Results: []
    }
    try{
        const ItemInCartCheckExist = `SELECT * FROM order_detail WHERE od_order_key = ?`;
        const ItemInCartCheckExistResult = await db.query(ItemInCartCheckExist, [OrderKey]);
        if(ItemInCartCheckExistResult.length > 0){
            const ReTotal = ItemInCartCheckExistResult.reduce((sum, item) => sum + (item.od_quantity * item.od_price), 0.00);
            const OrderStatesChange = `UPDATE order_list SET o_states = ?, o_total = ? WHERE o_order_key = ?`;
            const OrderStatesChangeResult = await db.query(OrderStatesChange, [States, ReTotal, OrderKey]);
            if(OrderStatesChangeResult.affectedRows > 0){
                const OrderInSession = `SELECT * FROM order_list WHERE o_order_key = ?`;
                const OrderInSessionResult = await db.query(OrderInSession, [OrderKey]);
                if(OrderInSessionResult.length > 0){
                    const OrderInSession2 = `SELECT * FROM order_list WHERE o_session_id = ?`;
                    const OrderInSessionResult2 = await db.query(OrderInSession2, [OrderInSessionResult[0].o_session_id]);
                    if(OrderInSessionResult2.length > 0){
                        const ReTableTotal = OrderInSessionResult2.reduce((sum, oList) => sum + parseFloat(oList.o_total), 0.00);
                        const CustomerTotalChange = `UPDATE customer_in_session SET cis_table_total = ? WHERE cis_session_id = ?`;
                        const CustomerTotalChangeResult = await db.query(CustomerTotalChange, [ReTableTotal, OrderInSessionResult[0].o_session_id]);
                        if(CustomerTotalChangeResult.affectedRows > 0){
                            data.Status = true;
                            data.Results = ['ดำเนินการแล้ว'];
                        }
                    }
                }
                
            }
        }
        
        
    } catch(error){
        console.log(error);
    }
    res.status(200).json(data);  
});

app.get("/AllOrder", async (req, res) => {
    let data = {
        Status: false,
        Results: []
    }
    try {
        const LastOrder = `SELECT order_list.*, customer_in_session.*, AllTable.* FROM order_list JOIN customer_in_session ON order_list.o_session_id = customer_in_session.cis_session_id JOIN AllTable ON customer_in_session.cis_table_key = AllTable.tb_key WHERE order_list.o_states != ? ORDER BY order_list.o_id DESC LIMIT 15`;
        const LastOrderResult = await db.query(LastOrder, ['order']);
        
        if (LastOrderResult.length > 0) {
            data.Results = LastOrderResult;
        
            const orderDetailPromises = LastOrderResult.map(async (List, i) => {
                const OrderDetail = `SELECT * FROM order_detail WHERE od_order_key = ?`;
                const OrderDetailResult = await db.query(OrderDetail, [List.o_order_key]);
                return { ...List, OrderLists: OrderDetailResult }; 
            });
        
            const orderDetails = await Promise.all(orderDetailPromises);
            data.Results = orderDetails;
            data.Status = true;
            res.status(200).json(data);  
        }
    } catch (error) {
        console.log(error);
        res.status(200).json(data);  
    }
});


app.get('/AllCustomerInSession', async(req, res) => {
    let data = {
        Status: false,
        Results: []
    }
    try {
        const AllCustomer = `SELECT customer_in_session.*, AllTable.* FROM customer_in_session JOIN AllTable ON customer_in_session.cis_table_key = AllTable.tb_key ORDER BY customer_in_session.cis_id DESC LIMIT 15`;
        const AllCustomerResult = await db.query(AllCustomer);
        if(AllCustomerResult.length > 0){
            const allCustomerResultPromises = AllCustomerResult.map(async(List, i) => {
                let OrderStatus = 0;
                let AllStatusFinish = false;

                const AllCustomerInSession = `SELECT * FROM order_list WHERE o_session_id = ? ORDER BY o_id DESC`;
                const AllCustomerInSessionResult = await db.query(AllCustomerInSession, [List.cis_session_id]);
                
                    const orderLoop = AllCustomerInSessionResult.map(async (oItemList, j) => {
                        const OrderDetail = `SELECT * FROM order_detail WHERE od_order_key = ?`;
                        const OrderDetailResult = await db.query(OrderDetail, [oItemList.o_order_key]);
                        if(oItemList.o_states == 'finish'){
                            OrderStatus += 1;
                        }
                        return { ...oItemList, ItemInOrder: OrderDetailResult }; 
                    });

                const orderDetails = await Promise.all(orderLoop);

                console.log(OrderStatus, AllCustomerInSessionResult.length);
                if(OrderStatus == AllCustomerInSessionResult.length && AllCustomerInSessionResult.length > 0){
                    AllStatusFinish = true;
                }
            
                // if(AllCustomerInSessionResult.length > 0){
                return { ...List, OrderOfSession: orderDetails, AllStatusFinish: AllStatusFinish }; 
                // }
            });
            const allCustomerLastResult = await Promise.all(allCustomerResultPromises);
            
            // data.Results = orderDetails;
            data.Results = allCustomerLastResult;
            data.Status = true;
        }
        
        

    } catch (error) {
        console.log(error);
    }
    res.status(200).json(data);


});

app.get('/ChangeStatusSession/:SessionID', async(req, res)=> {
    const SessionID = req.params.SessionID;
    let data = {
        Status: false,
        Results: []
    }
    const ChangeStatusSession = `UPDATE customer_in_session SET cis_status = ? WHERE cis_session_id = ?`;
    const ChangeStatusSessionResult = await db.query(ChangeStatusSession, ['finish', SessionID]);
    if(ChangeStatusSessionResult.affectedRows > 0){
        data.Status = true;
        data.Results = ['ดำเนินการแล้ว'];
    }
    res.status(200).json(data);

});


app.post('/InsertNewFoodList', async(req, res) => {
    const ProductKey = 'PDT-'+uniqid();
    const FoodList = req.body;
    let data = {
        Status: false,
        Results: []
    }

    if(!FoodList.FoodCategory || !FoodList.FoodName || !FoodList.FoodPrice || FoodList <= 0 || !FoodList.FoodImage || FoodList.FoodImage == null){
        return res.status(200).json(data);;
    } else{
        try {
            const InsertNewFoodList = `INSERT INTO product_list (p_product_key, p_category, p_price, p_name, p_description, p_image_path) VALUES (?, ?, ?, ?, ?, ?)`;
            const InsertNewFoodListResult = await db.query(InsertNewFoodList, [ProductKey, FoodList.FoodCategory, FoodList.FoodPrice, FoodList.FoodName, FoodList.FoodDescription, `Images/${ProductKey}.png`]);
            if(InsertNewFoodListResult.affectedRows > 0){
                const base64Image = FoodList.FoodImage.split(',')[1];
                const buffer = Buffer.from(base64Image, 'base64');
                const filePath = path.join(__dirname, `Images/${ProductKey}.png`);
                fs.writeFile(filePath, buffer, (err) => {
                    if (err) {
                    console.error('Error saving image:', err);
                    } else {
                    console.log('Image saved!');
                    }
                });
                data.Status = true;
                data.Results = ['ดำเนินการแล้ว'];
            }
        } catch (error) {
            console.error(error);
        }
    }
    
    res.status(200).json(data);
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
