import * as aiApiRequests from './ai-api-requests.ts';
import * as fse from './fse.ts';

export function trace(filename: string, line: number, ...params: any[]): void {
  console.log(`./tests/${filename}.ts:${line} - ` + params.join(' '));
}

interface TestModule {
  runTest(): void;
}

const testModules: TestModule[] = [aiApiRequests, fse];

function runAllTests(): void {
  for (const module of testModules) {
    module.runTest();
  }
}

runAllTests(); // Actually this was done only for calling async functions...
