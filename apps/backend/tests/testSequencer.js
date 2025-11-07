const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Sort tests by priority
    const testOrder = [
      'unit',          // Unit tests first
      'integration',   // Integration tests second
      'e2e'           // E2E tests last
    ];

    return tests.sort((testA, testB) => {
      const testAType = this.getTestType(testA.path);
      const testBType = this.getTestType(testB.path);
      
      const aIndex = testOrder.indexOf(testAType);
      const bIndex = testOrder.indexOf(testBType);
      
      // If both tests are in the defined order, sort by index
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one test is in the defined order, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither test is in the defined order, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }

  getTestType(testPath) {
    if (testPath.includes('/unit/')) return 'unit';
    if (testPath.includes('/integration/')) return 'integration';
    if (testPath.includes('/e2e/')) return 'e2e';
    
    // Default category for tests not in specific folders
    return 'other';
  }
}

module.exports = CustomSequencer;