const lines = [
  "[1,4:4736287,46220575:26673152,41484288,0",
  "h1,4:8799519,6571295:22609920,0,0",
  "g1,3:11475354,8865055"
];
const regex = /^[\[\(xkg\$h](\d+),(\d+):([\d.-]+),([\d.-]+)(?::([\d.-]+),([\d.-]+),([\d.-]+))?/;
for (const line of lines) {
  const match = line.match(regex);
  if (match) {
    console.log(match.slice(1));
  } else {
    console.log("NO MATCH", line);
  }
}
