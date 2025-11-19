import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

function DataUpload({ onUploadSuccess }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shopifyFile, setShopifyFile] = useState(null);
  const [sensorFile, setSensorFile] = useState(null);
  const [uploading, setUploading] = useState({ shopify: false, sensor: false });
  const [status, setStatus] = useState({ shopify: null, sensor: null });

  const handleShopifyUpload = async () => {
    if (!shopifyFile) {
      setStatus(prev => ({ ...prev, shopify: { success: false, message: 'Please select a file' } }));
      return;
    }

    setUploading(prev => ({ ...prev, shopify: true }));
    setStatus(prev => ({ ...prev, shopify: null })); // Clear previous status
    
    const formData = new FormData();
    formData.append('file', shopifyFile);

    try {
      console.log('Uploading Shopify file to:', `${API_BASE_URL}/api/upload/shopify`);
      const response = await axios.post(`${API_BASE_URL}/api/upload/shopify`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30 second timeout for large files
      });
      
      console.log('Shopify upload response:', response);
      
      if (response.data && response.data.records !== undefined) {
        setStatus(prev => ({
          ...prev,
          shopify: {
            success: true,
            message: `${response.data.records} transaction records uploaded successfully!`
          }
        }));
      } else {
        throw new Error('Invalid response format from server');
      }
      
      // Clear file selection
      setShopifyFile(null);
      const fileInput = document.getElementById('shopify-file-input');
      if (fileInput) fileInput.value = '';
      
      // Notify parent component to refresh data
      if (onUploadSuccess) {
        setTimeout(() => onUploadSuccess(), 1000);
      }
    } catch (error) {
      console.error('Shopify upload error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        code: error.code
      });
      
      let errorMessage = 'Upload failed. ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. File may be too large.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage += 'Network error. Make sure the backend server is running on port 8000.';
      } else if (error.response) {
        errorMessage += error.response.data?.detail || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'No response from server. Check if backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      setStatus(prev => ({
        ...prev,
        shopify: {
          success: false,
          message: errorMessage
        }
      }));
    } finally {
      setUploading(prev => ({ ...prev, shopify: false }));
    }
  };

  const handleSensorUpload = async () => {
    if (!sensorFile) {
      setStatus(prev => ({ ...prev, sensor: { success: false, message: 'Please select a file' } }));
      return;
    }

    setUploading(prev => ({ ...prev, sensor: true }));
    setStatus(prev => ({ ...prev, sensor: null })); // Clear previous status
    
    const formData = new FormData();
    formData.append('file', sensorFile);

    try {
      console.log('Uploading sensor file to:', `${API_BASE_URL}/api/upload/sensor`);
      const response = await axios.post(`${API_BASE_URL}/api/upload/sensor`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30 second timeout for large files
      });
      
      console.log('Sensor upload response:', response);
      
      if (response.data && response.data.entries !== undefined) {
        setStatus(prev => ({
          ...prev,
          sensor: {
            success: true,
            message: `${response.data.entries} sensor entries uploaded successfully!`
          }
        }));
      } else {
        throw new Error('Invalid response format from server');
      }
      
      // Clear file selection
      setSensorFile(null);
      const fileInput = document.getElementById('sensor-file-input');
      if (fileInput) fileInput.value = '';
      
      // Notify parent component to refresh data
      if (onUploadSuccess) {
        setTimeout(() => onUploadSuccess(), 1000);
      }
    } catch (error) {
      console.error('Sensor upload error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        code: error.code
      });
      
      let errorMessage = 'Upload failed. ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. File may be too large.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage += 'Network error. Make sure the backend server is running on port 8000.';
      } else if (error.response) {
        errorMessage += error.response.data?.detail || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'No response from server. Check if backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      setStatus(prev => ({
        ...prev,
        sensor: {
          success: false,
          message: errorMessage
        }
      }));
    } finally {
      setUploading(prev => ({ ...prev, sensor: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-8">
      {/* Header - Always Visible */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-xl font-bold text-gray-800">Import Data</h2>
          <p className="text-sm text-gray-500">Upload Shopify transactions and sensor data</p>
        </div>
        <svg
          className={`w-6 h-6 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-6 pt-0 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shopify Data Upload */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Shopify Transaction Data</h3>
          <p className="text-sm text-gray-500 mb-4">Upload CSV file exported from Shopify or Square POS</p>
          
          <div className="mb-4">
            <input
              id="shopify-file-input"
              type="file"
              accept=".csv"
              onChange={(e) => setShopifyFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
          </div>

          <button
            onClick={handleShopifyUpload}
            disabled={!shopifyFile || uploading.shopify}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              !shopifyFile || uploading.shopify
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading.shopify ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Shopify Data'
            )}
          </button>

          {status.shopify && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              status.shopify.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {status.shopify.message}
            </div>
          )}
        </div>

        {/* Sensor Data Upload */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Sensor Data</h3>
          <p className="text-sm text-gray-500 mb-4">Upload JSON file from LiDAR foot traffic sensor</p>
          
          <div className="mb-4">
            <input
              id="sensor-file-input"
              type="file"
              accept=".json"
              onChange={(e) => setSensorFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100
                cursor-pointer"
            />
          </div>

          <button
            onClick={handleSensorUpload}
            disabled={!sensorFile || uploading.sensor}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              !sensorFile || uploading.sensor
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {uploading.sensor ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Sensor Data'
            )}
          </button>

          {status.sensor && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              status.sensor.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {status.sensor.message}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">File Format Requirements:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Shopify CSV:</strong> Must include columns: Date, Time, Transaction ID, Customer ID, Item, Qty, Gross Sales</li>
          <li><strong>Sensor JSON:</strong> Must contain array of entries with: timestamp, device_id, direction (1=entry, 0=exit)</li>
        </ul>
      </div>
        </div>
      )}
    </div>
  );
}

export default DataUpload;
