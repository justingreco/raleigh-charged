var url = require('url');
var parts = url.parse(request.url, true);
var q = parts.query;
curl = require('node-curl');
curl(q.url, {CURLOPT_BINARYTRANSFER: true,
	CURLOPT_POST: true,
	CURLOPT_POSTFIELDS: q.values,
	CURLOPT_ENCODING: '',
	CURLOPT_HTTPHEADER: ['Content-Type: text/xml', 'Accept-Encoding: gzip, deflate']
}, function (err) {
	console.info(this);
});
