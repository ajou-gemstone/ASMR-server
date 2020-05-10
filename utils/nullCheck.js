function nullCheck(data) {
  if(data==null){
    data = "";
  }

  return data;
}

module.exports = nullCheck;
