const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

const app = express();
const PORT = 3000;
const XML_FILE = path.join(__dirname, 'contacts.xml');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function readContacts_FromXML(callback) {
  fs.readFile(XML_FILE, (err, data) => {
    if (err) return callback([]);
    xml2js.parseString(data, (err, result) => {
      if (err || !result || !result.contacts || !result.contacts.contact) return callback([]);
      callback(result.contacts.contact);
    });
  });
}

function writeContacts_ToXML(contacts, callback) {
  const builder = new xml2js.Builder();
  const xml = builder.buildObject({ contacts: { contact: contacts } });
  fs.writeFile(XML_FILE, xml, callback);
}

function addContactCallback(name, email, phone, res) {
  return function(contacts) {
    contacts.push({ name: [name], email: [email || ''], phone: [phone || ''] });
    writeContacts_ToXML(contacts, (err) => {
      if (err) return res.status(500).send('Error saving contact');
      res.send('Contact saved');
    });
  };
}

app.post('/api/add-contact', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) return res.status(400).send('Name is required');
  readContacts_FromXML(addContactCallback(name, email, phone, res));
});

function sendContactsCallback(res) {
  return function(contacts) {
    res.json(contacts);
  };
}

app.get('/api/contacts', (req, res) => {
  readContacts_FromXML(sendContactsCallback(res));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
