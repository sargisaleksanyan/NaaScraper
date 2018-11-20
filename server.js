const app = require('./app');
const port = process.env.PORT || 4000;

//start server
app.listen(port, () =>{
    console.log(`server is running on  ${port} port`);
});

