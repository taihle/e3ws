const url = require("url");
const wi = require('./wi.js');
const util = require('./util.js');

// e3ws router logic
var e3wsRouter = function (app) {
    
    app.get("/wi", function (req, res) {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        console.debug("wi query = ", JSON.stringify(query));
        if (query.loc) {
            wi.get(query.loc,
                function (data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send(data);
                },
                function (err) {
                    res.status(404).send(err);
                },
                query.api
            );
        }
        else {
            res.status(401).send({error:"INVALID REQUEST"});
        }
    });

    app.get("/wi/:zipcode", function (req, res) {
        var zipcode = req.params.zipcode;
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        console.debug("/wi/:zipcode = " + zipcode + ", query = " + JSON.stringify(query));
        wi.get(zipcode,
            function (data) {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(data);
            },
            function (err) {
                res.status(404).send(err);
            },
            query.api
        );
    });

    app.post("/log", function (req, res) {
        var clientId = req.body.clientId;
        //if (!clientId) {
        //    clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        //}
        if (clientId) {
            logger.log(clientId, req.body.msg);
        }
    });

}

module.exports = e3wsRouter;