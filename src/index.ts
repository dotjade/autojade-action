import * as core from '@actions/core';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface TestFile {
  name: string;
  content: string;
}

(async () => {
  try {
    // Log when action starts
    core.info('Starting the Autojade GitHub Action...');
    
    // Get inputs from the action.yml file
    const apiKey: string = core.getInput('api_key');
    const testFilesPath: string = core.getInput('test_files') || 'tests'; // Default to 'tests' folder
    const options: string = core.getInput('options') || '';

    // Log input parameters
    core.info(`API Key: ${apiKey}`);
    core.info(`Test Files Path: ${testFilesPath}`);
    core.info(`Options: ${options}`);

    // Check if the test directory exists
    if (!fs.existsSync(testFilesPath)) {
      core.error(`Test directory '${testFilesPath}' does not exist.`);
      core.setFailed(`The specified test directory '${testFilesPath}' does not exist.`);
      return;
    } else {
      core.info(`Test directory '${testFilesPath}' found.`);
    }

    // Read test files from the directory
    const testFiles: TestFile[] = fs.readdirSync(testFilesPath).map((file) => {
      core.info(`Processing file: ${file}`);
      return {
        name: file,
        content: fs.readFileSync(path.join(testFilesPath, file), 'utf8'),
      };
    });

    core.info(`Total test files found: ${testFiles.length}`);

    // Upload test files to Autojade server
    core.info('Uploading test files to Autojade...');
    const uploadResponse = await axios.post('http://34.136.164.16/api/upload', {
      apiKey: apiKey,
      files: testFiles,
      options: options,
    });

    const executionId: string = uploadResponse.data.executionId;
    core.info(`Upload successful. Received execution ID: ${executionId}`);

    // Poll the execution result
    core.info(`Polling the execution result for ID: ${executionId}...`);
    let result;
    do {
      core.debug('Waiting for the test results...');
      result = await axios.get(`http://34.136.164.16/api/status/${executionId}`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Delay for polling
    } while (result.data.status === 'pending');

    // Log the final result
    core.info(`Execution complete. Status: ${result.data.status}`);
    core.info(`Result: ${result.data.result}`);

    // Set the output result for the action
    core.setOutput('result', result.data);

} catch (error) {
    const errorMessage = (error as Error).message;
    core.error(`Error occurred: ${errorMessage}`);
    core.debug((error as Error).stack || '');
    core.setFailed(`Action failed with error: ${errorMessage}`);
}
})();
