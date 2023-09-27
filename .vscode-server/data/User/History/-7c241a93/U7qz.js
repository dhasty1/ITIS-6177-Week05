const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { body, param, validationResult } = require('express-validator');

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
app.use(express.json());

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
	    res.status(500).json({ error: 'Internal Server Error' });	
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
            res.status(500).json({ error: 'Internal Server Error' });
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
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            if (conn) {
              conn.end()
            }
        }
});

// Define validation and sanitation middleware for customer
const updateValidationCustomer = [
  param('CUST_CODE').isString().notEmpty().trim().withMessage('CUST_CODE is required and must be a string'),
  body('CUST_NAME').isString().notEmpty().trim().withMessage('CUST_NAME is required and must be a string'),
  body('CUST_CITY').isString().notEmpty().trim().withMessage('CUST_CITY is required and must be a string'),
  body('WORKING_AREA').isString().notEmpty().trim().withMessage('WORKING_AREA is required and must be a string'),
  body('CUST_COUNTRY').isString().notEmpty().trim().withMessage('CUST_COUNTRY is required and must be a string'),
  body('GRADE').isString().notEmpty().trim().withMessage('GRADE is required and must be a string'),
  body('OPENING_AMT').isNumeric().withMessage('OPENING_AMT must be a number'),
  body('RECEIVE_AMT').isNumeric().withMessage('RECEIVE_AMT must be a number'),
  body('PAYMENT_AMT').isNumeric().withMessage('PAYMENT_AMT must be a number'),
  body('OUTSTANDING_AMT').isNumeric().withMessage('OUTSTANDING_AMT must be a number'),
  body('PHONE_NO').isString().notEmpty().trim().withMessage('PHONE_NO is required and must be a string'),
  body('AGENT_CODE').isString().notEmpty().trim().withMessage('AGENT_CODE is required and must be a string'),
];

/**
 * @swagger
 * /customer/update/{CUST_CODE}:
 *   put:
 *     summary: Update a customer by CUST_CODE.
 *     parameters:
 *       - in: path
 *         name: CUST_CODE
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer code (unique identifier).
 *       - in: body
 *         name: customerData
 *         required: true
 *         description: Updated customer data.
 *         schema:
 *           type: object
 *           properties:
 *             CUST_NAME:
 *               type: string
 *             CUST_CITY:
 *               type: string
 *             WORKING_AREA:
 *               type: string
 *             CUST_COUNTRY:
 *               type: string
 *             GRADE:
 *               type: string
 *             OPENING_AMT:
 *               type: number
 *             RECEIVE_AMT:
 *               type: number
 *             PAYMENT_AMT:
 *               type: number
 *             OUTSTANDING_AMT:
 *               type: number
 *             PHONE_NO:
 *               type: string
 *             AGENT_CODE:
 *               type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully.
 *       404:
 *         description: Customer not found.
 *       500: 
 *         description: Database error.
 */
app.put('/customer/update/:CUST_CODE', updateValidationCustomer, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { CUST_CODE } = req.params;
  const customerData = req.body;

  let conn;
  try {
    // Get a connection from the pool
    conn = await pool.getConnection();

    // Update the customer in the database
    const result = await conn.query(
      'UPDATE customer SET ' +
      'CUST_NAME = ?, CUST_CITY = ?, WORKING_AREA = ?, CUST_COUNTRY = ?, ' +
      'GRADE = ?, OPENING_AMT = ?, RECEIVE_AMT = ?, PAYMENT_AMT = ?, ' +
      'OUTSTANDING_AMT = ?, PHONE_NO = ?, AGENT_CODE = ? ' +
      'WHERE CUST_CODE = ?',
      [
        customerData.CUST_NAME,
        customerData.CUST_CITY,
        customerData.WORKING_AREA,
        customerData.CUST_COUNTRY,
        customerData.GRADE,
        customerData.OPENING_AMT,
        customerData.RECEIVE_AMT,
        customerData.PAYMENT_AMT,
        customerData.OUTSTANDING_AMT,
        customerData.PHONE_NO,
        customerData.AGENT_CODE,
        CUST_CODE, // Where CUST_CODE matches
      ]
    );
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (conn) {
      conn.end()
    }
  }
});

const patchValidationCustomer = [
  param('CUST_CODE').isString().notEmpty().trim().withMessage('CUST_CODE is required and must be a string'),
  body().custom((value) => {
    if (Object.keys(value).length === 0) {
      throw new Error('At least one field to update is required');
    }
    return true;
  }),
];

/**
 * @swagger
 * /customer/update/{CUST_CODE}:
 *   patch:
 *     summary: Update a customer partially by CUST_CODE.
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: CUST_CODE
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer code (unique identifier).
 *       - in: body
 *         name: customerData
 *         required: true
 *         description: Updated customer data (partial update).
 *         schema:
 *           type: object
 *           properties:
 *             CUST_NAME:
 *               type: string
 *             CUST_CITY:
 *               type: string
 *             WORKING_AREA:
 *               type: string
 *             CUST_COUNTRY:
 *               type: string
 *             GRADE:
 *               type: string
 *             OPENING_AMT:
 *               type: number
 *             RECEIVE_AMT:
 *               type: number
 *             PAYMENT_AMT:
 *               type: number
 *             OUTSTANDING_AMT:
 *               type: number
 *             PHONE_NO:
 *               type: string
 *             AGENT_CODE:
 *               type: string
 *     responses:
 *       200:
 *         description: Customer partially updated successfully.
 *       404:
 *         description: Customer not found.
 *       500: 
 *         description: Database error.
 */
app.patch('/customer/update/:CUST_CODE', patchValidationCustomer, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { CUST_CODE } = req.params;
  const customerData = req.body;

  let conn;
  try {
    conn = await pool.getConnection();

    // Generate SQL for updating based on provided fields
    const updateFields = Object.keys(customerData).map((field) => `${field} = ?`).join(', ');

    // Update the customer in the database
    const result = await conn.query(
      `UPDATE customer SET ${updateFields} WHERE CUST_CODE = ?`,
      [...Object.values(customerData), CUST_CODE]
    );

    res.json({ message: 'Customer fields updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (conn) {
      conn.end()
    }
  }
});

// Define validation and sanitation middleware for POST
const postValidation = [
  body().isArray().withMessage('Data should be an array of agent records'),
  body().custom((value) => {
    if (value.length === 0) {
      throw new Error('At least one agent record is required');
    }
    return true;
  }),
  body().custom((value) => {
    // Check that each record has the required fields
    const validFields = ['AGENT_CODE', 'AGENT_NAME', 'WORKING_AREA', 'COMMISSION', 'PHONE_NO', 'COUNTRY'];
    for (const record of value) {
      for (const field of validFields) {
        if (!(field in record)) {
          throw new Error(`Field ${field} is missing in one or more records`);
        }
      }
    }
    return true;
  }),
  body().custom((value) => {
    // Validate and sanitize fields
    for (const record of value) {
      // Example validation: AGENT_CODE should be a non-empty string
      if (typeof record.AGENT_CODE !== 'string' || record.AGENT_CODE.trim() === '') {
        throw new Error('AGENT_CODE should be a non-empty string');
      }
      // You can add similar validation for other fields here
    }
    return true;
  }),
];

/**
 * @swagger
 * /agents/create:
 *   post:
 *     summary: Create a new agent record.
 *     tags: [Agents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               AGENT_CODE:
 *                 type: string
 *               AGENT_NAME:
 *                 type: string
 *               WORKING_AREA:
 *                 type: string
 *               COMMISSION:
 *                 type: string
 *               PHONE_NO:
 *                 type: string
 *               COUNTRY:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent record created successfully.
 *       500: 
 *         description: Database error.
 */
app.post('/agents/create', async (req, res) => {
  const agentData = req.body;

  let conn;
  try {
    conn = await pool.getConnection();

    // Insert the new agent record into the database
    const result = await conn.query(
      'INSERT INTO agents (AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY) ' +
      'VALUES (?, ?, ?, ?, ?, ?)',
      [
        agentData.AGENT_CODE,
        agentData.AGENT_NAME,
        agentData.WORKING_AREA,
        agentData.COMMISSION,
        agentData.PHONE_NO,
        agentData.COUNTRY
      ]
    );

    res.json({ message: 'Agent record created successfully' });
  } catch (error) {
    console.error('Error creating agent record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (conn) {
      conn.end()
    }
  }
});

/**
 * @swagger
 * /agents/delete/{AGENT_CODE}:
 *   delete:
 *     summary: Delete an agent record by AGENT_CODE.
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: AGENT_CODE
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent code (unique identifier) to delete.
 *     responses:
 *       200:
 *         description: Agent record deleted successfully.
 *       404:
 *         description: Agent not found.
 *       500: 
 *         description: Database error.
 */
app.delete('/agents/delete/:AGENT_CODE', async (req, res) => {
  const { AGENT_CODE } = req.params;

  let conn;
  try {
    conn = await pool.getConnection();

    // Delete the agent record from the database
    const result = await conn.query(
      'DELETE FROM agents WHERE AGENT_CODE = ?',
      [AGENT_CODE]
    );

    res.json({ message: 'Agent record deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (conn) {
      conn.end();
    }
  }
});


app.listen(port, () => {
  console.log('Example app listening at http://localhost:', port);
});
