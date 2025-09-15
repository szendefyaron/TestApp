"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const fs_1 = __importDefault(require("fs"));
const xml2js_1 = __importDefault(require("xml2js"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = 3000;
const XML_FILE = path_1.default.join(__dirname, 'contacts.xml');
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
function handleParseContacts(callback, err, result) {
    if (err || !result || !result.contacts || !result.contacts.contact)
        return callback([]);
    callback(result.contacts.contact);
}
function handleParseContactsCallback(callback) {
    return function handleParseContactsNamed(err, result) {
        handleParseContacts(callback, err, result);
    };
}
function handleReadContacts(callback, err, data) {
    if (err)
        return callback([]);
    xml2js_1.default.parseString(data, handleParseContactsCallback(callback));
}
function readContactsCallbackNamed(callback, err, data) {
    handleReadContacts(callback, err, data);
}
function readContacts_FromXML(callback) {
    fs_1.default.readFile(XML_FILE, (err, data) => readContactsCallbackNamed(callback, err, data));
}
function handleWriteContacts(callback, err) {
    callback(err);
}
function writeContactsCallbackNamed(callback, err) {
    handleWriteContacts(callback, err);
}
function writeContacts_ToXML(contacts, callback) {
    const builder = new xml2js_1.default.Builder();
    const xml = builder.buildObject({ contacts: { contact: contacts } });
    fs_1.default.writeFile(XML_FILE, xml, (err) => writeContactsCallbackNamed(callback, err));
}
function handleContactWritten(res, err) {
    if (err) {
        res.status(500).send('Error saving contact');
    }
    else {
        res.send('Contact saved');
    }
}
function contactWrittenCallbackNamed(res, err) {
    handleContactWritten(res, err);
}
function addContactToList(name, email, phone, res, contacts) {
    contacts.push({ name: [name], email: [email || ''], phone: [phone || ''] });
    writeContacts_ToXML(contacts, (err) => contactWrittenCallbackNamed(res, err));
}
function addContactCallbackNamed(name, email, phone, res, contacts) {
    addContactToList(name, email, phone, res, contacts);
}
function addContactCallback(name, email, phone, res) {
    return addContactCallbackNamed.bind(null, name, email, phone, res);
}
function handleAddContact(req, res) {
    const { name, email, phone } = req.body;
    if (!name) {
        res.status(400).send('Name is required');
        return;
    }
    readContacts_FromXML(addContactCallback(name, email, phone, res));
}
app.post('/api/add-contact', handleAddContact);
function sendContactsToClient(res, contacts) {
    res.json(contacts);
}
function sendContactsCallbackNamed(res, contacts) {
    sendContactsToClient(res, contacts);
}
function sendContactsCallback(res) {
    return sendContactsCallbackNamed.bind(null, res);
}
function handleGetContacts(req, res) {
    readContacts_FromXML(sendContactsCallback(res));
}
app.get('/api/contacts', handleGetContacts);
function onServerStart() {
    console.log(`Server running on http://localhost:${PORT}`);
}
app.listen(PORT, onServerStart);
