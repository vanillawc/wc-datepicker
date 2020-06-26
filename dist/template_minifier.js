var fs = require("fs");
var args = process.argv.slice(2);
var data = fs.readFileSync(args[0]);
var newStr = data.toString().replace(/\\n\s*/g,"");
newStr = newStr.replace(/\s{/g,"{");
fs.writeFile(args[1], newStr, function (err) {
  if (err) throw err;
});
