'use strict';
// create an API server
const Restify = require('restify');
const server = Restify.createServer({
	name: 'MovieMate'
});
const tmdb = require('./tmdb');
const PORT = process.env.PORT || 3000;

server.use(Restify.jsonp());
server.use(Restify.bodyParser());
server.use((req, res, next) => f.verifySignature(req, res, next));

// Tokens
const config = require('./config');

// FBeamer
const FBeamer = require('./fbeamer');
const f = new FBeamer(config.FB);

// Register the webhooks
server.get('/', (req, res, next) => {
	f.registerHook(req, res);
	return next();
});

// Receive all incoming messages
server.post('/', (req, res, next) => {
	f.incoming(req, res, msg => {
		// Process messages
		const {
			message,
			sender
		} = msg;

		if(message.text && message.nlp.entities) {
			tmdb(message.nlp.entities)
				.then(response => {
					f.txt(sender, response.txt);
					if(response.img) {
						f.img(sender, response.img);
					}
				})
				.catch(error => {
					console.log(error);
					f.txt(sender, 'My servers are acting up. Do check back later...');
				});
			// If a text message is received
			//f.txt(sender, `You just said ${message.text}`);
			
		}
	});
	return next();
});

// Subscribe
f.subscribe();

server.listen(PORT, () => console.log(`MovieMate running on port ${PORT}`));
