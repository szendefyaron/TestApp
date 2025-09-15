import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import xml2js from 'xml2js';
import path from 'path';

const app: express.Express = express();
const PORT: number = 3000;
const XML_FILE: string = path.join(__dirname, 'contacts.xml');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

type Contact = {
  name: string[];
  email: string[];
  phone: string[];
};

type ContactsCallback = (contacts: Contact[]) => void;

type WriteCallback = (err: NodeJS.ErrnoException | null) => void;

function handleParseContacts(callback: ContactsCallback, err: Error | null, result: any): void {
  if (err || !result || !result.contacts || !result.contacts.contact) return callback([]);
  callback(result.contacts.contact as Contact[]);
}

function handleParseContactsCallback(callback: ContactsCallback): (err: Error | null, result: any) => void {
  return function handleParseContactsNamed(err: Error | null, result: any): void {
    handleParseContacts(callback, err, result);
  };
}

function handleReadContacts(callback: ContactsCallback, err: NodeJS.ErrnoException | null, data: Buffer): void {
  if (err) return callback([]);
  xml2js.parseString(data, handleParseContactsCallback(callback));
}

function readContactsCallbackNamed(callback: ContactsCallback, err: NodeJS.ErrnoException | null, data: Buffer): void {
  handleReadContacts(callback, err, data);
}

function readContacts_FromXML(callback: ContactsCallback): void {
  fs.readFile(XML_FILE, (err, data) => readContactsCallbackNamed(callback, err, data));
}

function handleWriteContacts(callback: WriteCallback, err: NodeJS.ErrnoException | null): void {
  callback(err);
}

function writeContactsCallbackNamed(callback: WriteCallback, err: NodeJS.ErrnoException | null): void {
  handleWriteContacts(callback, err);
}

function writeContacts_ToXML(contacts: Contact[], callback: WriteCallback): void {
  const builder: xml2js.Builder = new xml2js.Builder();
  const xml: string = builder.buildObject({ contacts: { contact: contacts } });
  fs.writeFile(XML_FILE, xml, (err) => writeContactsCallbackNamed(callback, err));
}

function handleContactWritten(res: Response, err: NodeJS.ErrnoException | null): void {
  if (err) {
    res.status(500).send('Error saving contact');
  } else {
    res.send('Contact saved');
  }
}

function contactWrittenCallbackNamed(res: Response, err: NodeJS.ErrnoException | null): void {
  handleContactWritten(res, err);
}

function addContactToList(name: string, email: string, phone: string, res: Response, contacts: Contact[]): void {
  contacts.push({ name: [name], email: [email || ''], phone: [phone || ''] });
  writeContacts_ToXML(contacts, (err) => contactWrittenCallbackNamed(res, err));
}

function addContactCallbackNamed(name: string, email: string, phone: string, res: Response, contacts: Contact[]): void {
  addContactToList(name, email, phone, res, contacts);
}

function addContactCallback(name: string, email: string, phone: string, res: Response): ContactsCallback {
  return addContactCallbackNamed.bind(null, name, email, phone, res);
}

function handleAddContact(req: Request, res: Response): void {
  const { name, email, phone }: { name: string; email: string; phone: string } = req.body;
  if (!name) {
    res.status(400).send('Name is required');
    return;
  }
  readContacts_FromXML(addContactCallback(name, email, phone, res));
}
app.post('/api/add-contact', handleAddContact);

function sendContactsToClient(res: Response, contacts: Contact[]): void {
  res.json(contacts);
}

function sendContactsCallbackNamed(res: Response, contacts: Contact[]): void {
  sendContactsToClient(res, contacts);
}

function sendContactsCallback(res: Response): ContactsCallback {
  return sendContactsCallbackNamed.bind(null, res);
}

function handleGetContacts(req: Request, res: Response): void {
  readContacts_FromXML(sendContactsCallback(res));
}
app.get('/api/contacts', handleGetContacts);


function onServerStart(): void {
  console.log(`Server running on http://localhost:${PORT}`);
}
app.listen(PORT, onServerStart);
