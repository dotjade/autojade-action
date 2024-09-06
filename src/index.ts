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
    const apiKey: string = core.getInput('api_key');
    const testFilesPath: string = core.getInput('test_files') || 'tests'; // Default to 'tests' folder
    const options: string = core.getInput('options') || '';

    // Check if the test directory exists
    if (!fs.existsSync(testFilesPath)) {
      core.setFailed(`The specified test directory '${testFilesPath}' does not exist.`);
      return;
    }

    // Read test files from the directory
    const testFiles: TestFile[] = fs.readdirSync(testFilesPath).map((file) => {
      return {
        name: file,
        content: fs.readFileSync(path.join(testFilesPath, file), 'utf8')
      };
    });

    // Upload test files to Autojade
    const uploadResponse = await axios.post('http://34.136.164.16/api/upload', {
      apiKey: apiKey,
      files: testFiles,
      options: options
    });

    const executionId: string = uploadResponse.data.executionId;

    // Poll the execution result
    let result;
    do {
      result = await axios.get(`http://34.136.164.16/api/status/${executionId}`);
    } while (result.data.status === 'pending');

    // Output the result
    core.setOutput('result', result.data);
  } catch (error) {
    core.setFailed(`Error: ${(error as Error).message}`);
  }
})();


