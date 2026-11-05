import { calculateAttendanceMetrics, simulateAttendance } from './src/services/calculationEngine';

console.log('--- Testing Attendance Calculations ---');

// Test Case 1: Example from prompt
// Subject: Data Structures, Total Classes: 40, Attended: 32, Absent: 8
// Attendance: 80% (0.80 >= 0.75)
// Required: 0 ("Already achieved")
// Margin: floor((32 / 0.75) - 40) = floor(42.666... - 40) = floor(2.666...) = 2 classes
const res1 = calculateAttendanceMetrics(40, 32, 75);
console.log('Test 1 (40 total, 32 attended, 75% target):');
console.log('Percentage:', res1.percentage, '%');
console.log('Required:', res1.requiredClasses);
console.log('Margin:', res1.margin);
console.log('Status:', res1.status);
if (res1.percentage === 80 && res1.requiredClasses === 0 && res1.margin === 2) {
  console.log('✅ Test 1 Passed!');
} else {
  console.error('❌ Test 1 Failed!', res1);
  process.exit(1);
}

// Test Case 2: Shortage case
// Total: 20, Attended: 10, Target: 75%
// Attendance: 50%
// Required: ceil((0.75 * 20 - 10) / (1 - 0.75)) = ceil((15 - 10) / 0.25) = ceil(5 / 0.25) = 20
// Margin: floor((10 / 0.75) - 20) = floor(13.333 - 20) = floor(-6.666) -> 0
const res2 = calculateAttendanceMetrics(20, 10, 75);
console.log('\nTest 2 (20 total, 10 attended, 75% target):');
console.log('Percentage:', res2.percentage, '%');
console.log('Required:', res2.requiredClasses);
console.log('Margin:', res2.margin);
if (res2.percentage === 50 && res2.requiredClasses === 20 && res2.margin === 0) {
  console.log('✅ Test 2 Passed!');
} else {
  console.error('❌ Test 2 Failed!', res2);
  process.exit(1);
}

// Test Case 3: Exactly 75%
// Total: 40, Attended: 30
// Attendance: 75%
// Required: 0
// Margin: floor((30 / 0.75) - 40) = floor(40 - 40) = 0
const res3 = calculateAttendanceMetrics(40, 30, 75);
console.log('\nTest 3 (40 total, 30 attended, 75% target):');
console.log('Percentage:', res3.percentage, '%');
console.log('Required:', res3.requiredClasses);
console.log('Margin:', res3.margin);
if (res3.percentage === 75 && res3.requiredClasses === 0 && res3.margin === 0) {
  console.log('✅ Test 3 Passed!');
} else {
  console.error('❌ Test 3 Failed!', res3);
  process.exit(1);
}

// Test Case 4: What-if simulation
// Currently 40 total, 32 attended (80%). What if student misses next 3 classes?
// Future total: 43, future attended: 32.
// New percentage: 32 / 43 = 74.42% (below 75%!)
const sim = simulateAttendance(40, 32, 3, 0, 75);
console.log('\nTest 4 (Simulation: 40 total, 32 attended, miss 3 classes):');
console.log('Projected total:', sim.projectedTotal);
console.log('Projected attended:', sim.projectedAttended);
console.log('Projected %:', sim.projectedPercentage);
console.log('Will meet target:', sim.willMeetTarget);
if (sim.projectedTotal === 43 && sim.projectedPercentage === 74.42 && !sim.willMeetTarget) {
  console.log('✅ Test 4 Passed!');
} else {
  console.error('❌ Test 4 Failed!', sim);
  process.exit(1);
}

console.log('\n🎉 ALL CALCULATION FORMULA TESTS PASSED PERFECTLY!');

