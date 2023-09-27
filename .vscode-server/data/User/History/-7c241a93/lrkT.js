const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = 3000;

const mariadb = require('mariadb');
const pool = mariadb.createPool({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'sample',
	port: 3306,
	connectionLimit: 5
});

const options = {
  swaggerDefinition: {
    info: {
      title: 'Logans API',
      version: '1.0.0',
      description: 'API testing the use of MariaDB'
    },
    host: 'localhost:3000',
    basePath: '/'
  },
  apis: ['./server.js'], 
};
const specs = swaggerJsdoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
app.use(cors());

/**
 * @swagger
 * /customers:
 *     get:
 *        description: Return all customers
 *        tags: [Customers]
 *        produces:
 *          - application/json
 *        responses:
 *          200:
 *           description: Object containing array of customers
 *          500:
 *           description: Database error
 */
app.get('/customers', async (req, res) => {
	let conn;
	try {
	  conn = await pool.getConnection();
	  const query = 'SELECT * FROM customer';
	  const rows = await conn.query(query);
	  res.setHeader('Content-Type', 'application/json');
	  res.json(rows);
	} catch (err) {
	    console.log('Error querying database: ', err);
	    res.status(500).json({ error: 'Database error' });	
	} finally {
	    if (conn) {
	      conn.end()
	    }
	}
});

/**
 * @swagger
 * /customers/:custCode:
 *     get:
 *        description: Return customer with user-specified customer code
 *        tags: [Customers]
 *        produces:
 *          - application/json
 *        responses:
 *          200:
 *           description: Object containing record of customer
 *          404:
 *           description: Customer not found
 *          500:
 *           description: Database error
 */
app.get('/customers/:custCode', async (req, res) => {
        const custCode = req.params.custCode;

	let conn;

        try {
          conn = await pool.getConnection();
          const query = 'SELECT * FROM customer WHERE CUST_CODE = ?';
          const rows = await conn.query(query, [custCode]);
          res.setHeader('Content-Type', 'application/json');
          if (rows.length === 0) {
	          res.status(404).json({ message: 'Customer not found' });
	        } else {
	          res.json(rows[0]);
	        };
        } catch (err) {
            console.log('Error querying database: ', err);
            res.status(500).json({ error: 'Database error' });
        } finally {
            if (conn) {
              conn.end()
            }
        }
});

/**
 * @swagger
 * /agents:
 *     get:
 *        description: Return all agents
 *        tags: [Agents]
 *        produces:
 *          - application/json
 *        responses:
 *          200:
 *           description: Object containing array of agents
 *          500:
 *           description: Database error
 */
app.get('/agents', async (req, res) => {
        let conn;
        try {
          conn = await pool.getConnection();
          const query = 'SELECT * FROM agents';
          const rows = await conn.query(query);
          res.setHeader('Content-Type', 'application/json');
          res.json(rows);
        } catch (err) {
            console.log('Error querying database: ', err);
            res.status(500).json({ error: 'Database error' });
        } finally {
            if (conn) {
              conn.end()
            }
        }
});

app.listen(port, () => {
  console.log('Example app listening at http://localhost:', port);
});
