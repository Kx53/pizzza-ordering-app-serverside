-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Nov 04, 2024 at 03:34 PM
-- Server version: 5.7.39
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pizza_ordering_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `AllTable`
--

CREATE TABLE `AllTable` (
  `tb_id` int(10) NOT NULL,
  `tb_name` varchar(255) NOT NULL,
  `tb_key` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `customer_in_session`
--

CREATE TABLE `customer_in_session` (
  `cis_id` int(10) NOT NULL,
  `cis_session_id` varchar(500) NOT NULL,
  `cis_table_key` varchar(500) NOT NULL,
  `cis_datetime` datetime NOT NULL,
  `cis_status` varchar(255) NOT NULL,
  `cis_table_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `order_detail`
--

CREATE TABLE `order_detail` (
  `od_id` int(10) NOT NULL,
  `od_order_key` varchar(500) NOT NULL,
  `od_product_key` varchar(500) NOT NULL,
  `od_name` varchar(255) NOT NULL,
  `od_price` decimal(10,2) NOT NULL,
  `od_quantity` int(10) NOT NULL,
  `od_subtotal` int(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `order_list`
--

CREATE TABLE `order_list` (
  `o_id` int(10) NOT NULL,
  `o_session_id` varchar(500) NOT NULL,
  `o_order_key` varchar(500) NOT NULL,
  `o_total` decimal(10,2) NOT NULL,
  `o_description` text,
  `o_states` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `product_list`
--

CREATE TABLE `product_list` (
  `p_id` int(10) NOT NULL,
  `p_product_key` varchar(500) NOT NULL,
  `p_category` varchar(30) NOT NULL,
  `p_price` decimal(10,2) NOT NULL,
  `p_name` varchar(255) NOT NULL,
  `p_description` text NOT NULL,
  `p_image_path` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `AllTable`
--
ALTER TABLE `AllTable`
  ADD PRIMARY KEY (`tb_id`);

--
-- Indexes for table `customer_in_session`
--
ALTER TABLE `customer_in_session`
  ADD PRIMARY KEY (`cis_id`);

--
-- Indexes for table `order_detail`
--
ALTER TABLE `order_detail`
  ADD PRIMARY KEY (`od_id`);

--
-- Indexes for table `order_list`
--
ALTER TABLE `order_list`
  ADD PRIMARY KEY (`o_id`);

--
-- Indexes for table `product_list`
--
ALTER TABLE `product_list`
  ADD PRIMARY KEY (`p_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `AllTable`
--
ALTER TABLE `AllTable`
  MODIFY `tb_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_in_session`
--
ALTER TABLE `customer_in_session`
  MODIFY `cis_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_detail`
--
ALTER TABLE `order_detail`
  MODIFY `od_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_list`
--
ALTER TABLE `order_list`
  MODIFY `o_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_list`
--
ALTER TABLE `product_list`
  MODIFY `p_id` int(10) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
