export function createUniqueEmployeeId() {
  const timestampSuffix = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return Number(`${timestampSuffix}${randomSuffix}`);
}