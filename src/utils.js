export function parseScientific(numberString) {
  var info = /([\d\\.]+)e-(\d+)/i.exec(numberString);
  if (!info) {
    return parseFloat(numberString);
  }

  var num = info[1].replace(".", ""),
    numDecs = info[2] - 1;
  var output = "0.";
  for (var i = 0; i < numDecs; i++) {
    output += "0";
  }
  output += num;
  return parseFloat(output);
}


export function splitAttributeParams(attr) {
  if (attr.indexOf(",") >= 0) {
    return attr.split(",");
  } else {
    //Especially in IE Edge, the parameters do not have to be split by commas, IE even replaces commas with spaces!
    return attr.split(" ");
  }
}
