const express = require('express');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Database connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'vehicle',
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database.');
});

// Route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

// Route to get all vehicles
app.get('/vehicles', (req, res) => {
  const query = 'SELECT * FROM vehicle';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch vehicles' });
      return;
    }
    res.json(results);
  });
});

// Route to add a new vehicle
app.post('/vehicles', (req, res) => {
  const { staff_id, vehicle_type, price_per_day, availability_status } = req.body;

  if (!staff_id || !vehicle_type || !price_per_day) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Check if the staff ID exists
  const checkStaffQuery = 'SELECT * FROM staff WHERE staff_id = ?';
  db.query(checkStaffQuery, [staff_id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Failed to verify staff ID' });
      return;
    }

    if (results.length === 0) {
      // If staff doesn't exist, create a new staff entry
      const createStaffQuery = `INSERT INTO staff (staff_id) VALUES (?)`;
      db.query(createStaffQuery, [staff_id], (err) => {
        if (err) {
          res.status(500).json({ error: 'Failed to create staff' });
          return;
        }

        // Now add the vehicle after creating the staff
        const addVehicleQuery = `INSERT INTO vehicle (staff_id, vehicle_type, price_per_day, availability_status) VALUES (?, ?, ?, ?)`;
        db.query(
          addVehicleQuery,
          [staff_id, vehicle_type, price_per_day, availability_status || 'available'],
          (err) => {
            if (err) {
              res.status(500).json({ error: 'Failed to add vehicle' });
              return;
            }
            res.json({ message: 'Staff created and vehicle added successfully' });
          }
        );
      });
    } else {
      // If staff exists, add the vehicle
      const addVehicleQuery = `INSERT INTO vehicle (staff_id, vehicle_type, price_per_day, availability_status) VALUES (?, ?, ?, ?)`;
      db.query(
        addVehicleQuery,
        [staff_id, vehicle_type, price_per_day, availability_status || 'available'],
        (err) => {
          if (err) {
            res.status(500).json({ error: 'Failed to add vehicle' });
            return;
          }
          res.json({ message: 'Vehicle added successfully' });
        }
      );
    }
  });
});


// Route to update price per day of a vehicle
app.put('/vehicles/:id/price', (req, res) => {
  const { id } = req.params;
  const { price_per_day } = req.body;

  const query = 'UPDATE vehicle SET price_per_day = ? WHERE vehicle_id = ?';
  db.query(query, [price_per_day, id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Failed to update price' });
      return;
    }
    res.json({ message: 'Price updated successfully' });
  });
});

// Route to change availability status of a vehicle
app.put('/vehicles/:id/status', (req, res) => {
  const { id } = req.params;
  const { availability_status } = req.body;

  const query = 'UPDATE vehicle SET availability_status = ? WHERE vehicle_id = ?';
  db.query(query, [availability_status, id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Failed to update status' });
      return;
    }
    res.json({ message: 'Availability status updated successfully' });
  });
});

// Route to delete a vehicle
app.delete('/vehicles/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM vehicle WHERE vehicle_id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Failed to delete vehicle' });
      return;
    }
    res.json({ message: 'Vehicle deleted successfully' });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
