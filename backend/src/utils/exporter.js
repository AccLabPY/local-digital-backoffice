const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const config = require('../config/config');

/**
 * Utility class for exporting data to different formats
 */
class Exporter {
  /**
   * Export data to CSV format
   * @param {Array} data - The data to export
   * @param {String} fileName - The name of the file (without extension)
   * @returns {String} - Path to the exported file
   */
  static async exportToCSV(data, fileName) {
    try {
      if (!data || !data.length) {
        throw new Error('No data to export');
      }
      
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      const exportDir = path.join(config.logging.directory, 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const filePath = path.join(exportDir, `${fileName}_${Date.now()}.csv`);
      xlsx.writeFile(workbook, filePath, { bookType: 'csv' });
      
      logger.info(`Data exported to CSV: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Error exporting to CSV: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Export data to Excel format
   * @param {Array} data - The data to export
   * @param {String} fileName - The name of the file (without extension)
   * @returns {String} - Path to the exported file
   */
  static async exportToExcel(data, fileName) {
    try {
      if (!data || !data.length) {
        throw new Error('No data to export');
      }
      
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      const exportDir = path.join(config.logging.directory, 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const filePath = path.join(exportDir, `${fileName}_${Date.now()}.xlsx`);
      xlsx.writeFile(workbook, filePath);
      
      logger.info(`Data exported to Excel: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Error exporting to Excel: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Exporter;
