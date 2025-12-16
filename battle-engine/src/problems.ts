export interface TestCase {
  input: string;
  output: string[];
}

export const PROBLEMS: Record<string, { description: string, testCases: TestCase[] }> = {
  "fibonacci": {
    description: "Write a function that prints 'hello world'",
    testCases: [
      { input: "", output: ["hello world"] } 
    ]
  }
};