var Connection = require('../connection');

//Initialize new API Connection:
var api = new Connection({
    hash: 'cta3pou86s',
    token: 'app0ccpro9sexqmt8mtzsupbdyqpnnm',
    cid: '86nta75e1p07qbsp5i7v2vg83x9w7yi',
    host: 'https://api.bigcommerce.com' //The BigCommerce API Host
});

var appRouter = function (app) {

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.get("/", function (req, res) {
        res.status(200).send({
            message: 'Welcome to the API'
        });
    });

    // maximum value for sort order given by BC
    var newSortOrder = 2147483647;

    // Switched to BC api v3

    function outOfStockOrder() {

            api.get('products?inventory_level=0&limit=5000').then(function (response) {

                let totalPages = response.meta.pagination.total_pages;


                for(var i = 1; i <= totalPages; i++) {
                    console.log(i);

                    // BC api v3 allows filter queries such as inventory_level=0 which will return all out of stock products 
                    api.get('products?inventory_level=0&page='+i+'&limit=5000').then(function (productsOne) {

                        // Looping through out of stock products
                        Object.keys(productsOne).forEach(function (outOfStockItem) {

                            for(var i = 0; i < productsOne[outOfStockItem].length; i++) {

                                // Checking to see if we've already changed the sort order for this product
                                if(productsOne[outOfStockItem][i].sort_order < newSortOrder) {

                                    // If product hasn't been sorted before this means it recently went out of stock
                                    // Update out of stock product with new sort order
                                    api.put('products/' + productsOne[outOfStockItem][i].id, {
                                        sort_order: newSortOrder
                                    }).then(function (req, res) {
                                        // console.log(req);
                                    }).catch((err) => {
                                        console.log(err)
                                    });

                                }
                            }
                        });


                    // Return error if any
                    }).catch((err) => {
                        console.log(err)
                    });

                }

            // Return error if any
            }).catch((err) => {
                console.log(err)
            });

            api.get('products?inventory_level:greater=0&limit=5000').then(function (response) {

                let totalPages2 = response.meta.pagination.total_pages;


                for(var i = 1; i <= totalPages2; i++) {

                    // BC api v3 allows filter queries such as inventory_level:greater=0 which will return all in stock products 
                    api.get('products?inventory_level:greater=0&page='+i+'&limit=5000').then(function (productsTwo) {

                        // Looping through in stock products
                        Object.keys(productsTwo).forEach(function (inStockItem) {

                            for (var j = 0; j < productsTwo[inStockItem].length; j++)
                                // Check if in stock product has the maximum sort order which means this product was recently restocked
                                if(productsTwo[inStockItem][j].sort_order === newSortOrder) {

                                    // Update recently restocked product with sort order or 0
                                    api.put('products/' + productsTwo[inStockItem][j].id, {
                                        sort_order: 0
                                    }).then(function (req, res) {
                                        // console.log(req);
                                    }).catch((err) => {
                                        console.log(err)
                                    });
                                }
                        });

                    // Return error if any
                    }).catch((err) => {
                        console.log(err)
                    });
                }
            }).catch((err) => {
                console.log(err)
            });

    }

    // Running app for the first time
    outOfStockOrder();

    // Running the app again after 1 hour
    setInterval(function () {
        outOfStockOrder();
        console.log('Rerunning after 20 minutes have passed');
    }, 1200000);

};

module.exports = appRouter;