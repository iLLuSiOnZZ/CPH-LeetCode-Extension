# CPH-LeetCode-Extension

CPH LeetCode Extension is a VS Code extension that enhances your LeetCode coding experience by allowing you to fetch test cases directly from LeetCode problem URLs. It provides features for storing test cases, running them locally, and supporting multiple programming languages like Python and C++.

## Features

### 1. Problem URL Fetching
- Fetch test cases from LeetCode problem URLs.
- Parse problem descriptions to extract input and expected output test cases.
- Handle problems with multiple test cases.
- Store test cases in a structured format for local testing.

### 2. Test Case Storage
- Test cases are stored in a format compatible with the Competitive Programming Helper (CPH) extension.
- Input files are named `input_1.txt`, `input_2.txt`, etc.
- Output files are named `output_1.txt`, `output_2.txt`, etc.

### 3. Code Execution
- Write code in your preferred programming language.
- Execute code against fetched test cases.
- Compare actual outputs with expected outputs.

### 4. Multi-Language Support
- Supports commonly used languages such as Python and C++.
- Customizable compile and run commands in the settings for each language.

## Usage

### Commands

- **Fetch Test Cases**: `cph.fetchTestCases`
  - Prompts the user to enter a LeetCode problem URL.
  - Fetches and stores test cases locally.

- **Run Test Cases**: `cph.runTestCases`
  - Compiles and runs the code against the stored test cases.
  - Displays the results for each test case.

### How to Use

1. Open your coding workspace in VS Code.
2. Use the `Fetch Test Cases` command to retrieve test cases from a LeetCode problem URL.
3. Write your code in the editor.
4. Use the `Run Test Cases` command to execute your code and see the results.

## Installation

1. Clone this repository.
2. Open the cloned repository in VS Code.
3. Run `npm install` to install the necessary dependencies.
4. Press `F5` to launch the extension in a new VS Code window for testing.

## Dependencies

- [Puppeteer](https://pptr.dev/) for web scraping.
- [Child Process](https://nodejs.org/api/child_process.html) for executing commands.
- [Node.js File System](https://nodejs.org/api/fs.html) for file handling.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features you'd like to see.

## License

This project is licensed under the MIT License.
