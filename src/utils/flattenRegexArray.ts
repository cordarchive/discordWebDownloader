export function flattenRegexArray(array: any) {
  for (let i = 0; i <= array.length - 1; i++) {
    const element = [...array[i]];
    if (element[0].includes("assets")) {
      array[i] = element[0];
    } else if (element[1].match(/([0-9a-f]{8,}\.\w+)/)) {
      array[i] = `/assets/${element[1]}`;
    } else {
      array[i] = [
        `/assets/${element[1]}.${element[2]}.js`,
        `/assets/${element[1]}.${element[2]}.worker.js`,
        `/assets/${element[2]}.js`,
        `/assets/${element[2]}.worker.js`,
      ];
    }
  }
  return array.flat(Infinity);
}
