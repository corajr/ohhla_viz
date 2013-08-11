function sumArrays(array1, array2) {
  var len = array1.length;
  while (len--) {
    array1[len] += array2[len];
  }
  return array1;
}

function subtractArrays(array1, array2) {
  var len = array1.length;
  while (len--) {
    array1[len] -= array2[len];
  }
  return array1;
}

function reduceAdd (p, v) {
  return sumArrays(p, v.topics);
}

function reduceSubtract (p, v) {
  return subtractArrays(p, v.topics);
}
function reduceInitial(topics_n) {
  return function () {
    var len = topics_n,
        array = new Array(len);
    while (len--) {
      array[len] = 0.0;
    }
    return array;
  };
}

function b64toFloatArray(s) {
    var raw = window.atob(s),
        rawLength = raw.length,
        array = new Uint8Array(new ArrayBuffer(rawLength));
    while (rawLength--) {
        array[rawLength] = raw.charCodeAt(rawLength);
    }
    return new Float32Array(array.buffer);
}

var isoFormatParse = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;

var doc_data = d3.values(data["DOC_METADATA"]),
    len = doc_data.length;

while (len--) {
    var date = doc_data[len].date.trim();
    if (date != "") {
      date = isoFormatParse(date);
      doc_data[len].date = date;
      doc_data[len].topics = b64toFloatArray(doc_data[len].topics);
      if (doc_data[len].title.trim() == "") {
        doc_data[len].title = "[untitled]";
      }
      doc_data[len] = App.Document.create(doc_data[len]);
    } else {
      doc_data.splice(len, 1);
    }
}

App.documents = doc_data;

App.topics = [];
for (var i = 0, n = Object.keys(data['TOPIC_LABELS']).length; i < n; i++) {
  var topic = data['TOPIC_LABELS'][i];
  App.topics.push(App.Topic.create({
    id: i,
    topWords: topic['words']
  }));
}