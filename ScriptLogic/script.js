import express from "express";
import { google } from "googleapis";
import { Base64 } from "js-base64";
import cheerio from "cheerio";

import events from "events";

export const startServer = () => {
  const app = express();
  const PORT = 3000;
  const eventEmitter = new events.EventEmitter();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  const credentials = {
    installed: {
      client_id: "",
      client_secret: "",
      redirect_uris: ["http://localhost:3000/callback"],
    },
  };

  const redirectUri =
    credentials.installed.redirect_uris &&
    credentials.installed.redirect_uris[0];

  if (!redirectUri) {
    console.error(
      "Error: 'redirect_uris' is not defined or is empty in the credentials."
    );
  } else {
    const auth = new google.auth.OAuth2(
      credentials.installed.client_id,
      credentials.installed.client_secret,
      redirectUri
    );

    app.get("/", (req, res) => {
      const authUrl = auth.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/gmail.readonly"],
      });

      res.redirect(authUrl);
    });

    app.get("/callback", async (req, res) => {
      try {
        const { code } = req.query;
        const { tokens } = await auth.getToken(code);

        auth.setCredentials(tokens);

        if (!auth.credentials || !auth.credentials.access_token) {
          console.error("Access token is missing or invalid.");
          return;
        }

        const data = await getLatestEmail(auth);

        if (data) {
          eventEmitter.emit("dataRetrieved", data);
          res.send("Authentication successful!");
        } else {
          // Handle the case where no data is available
          console.error("No data available to emit.");
          res.status(404).send("No data available.");
        }

        res.send("Authentication successful!");
      } catch (error) {
        console.error("Error during token retrieval:", error);
        res.status(500).send("Error during token retrieval");
      }
    });
  }

  return eventEmitter;
};

const getLatestEmail = async (auth) => {
  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: 1, // Fetch only the latest email
  });

  if (list.data.messages && list.data.messages.length > 0) {
    const latestEmailId = list.data.messages[0].id;

    // message is the object of EMAIL.

    const message = await gmail.users.messages.get({
      userId: "me",
      id: latestEmailId,
    });

    let parts = message.data.payload.parts;
    let emails = [];

    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      if (part.mimeType === "text/html") {
        let body = part.body.data;
        body = atob(body.replace(/-/g, "+").replace(/_/g, "/")); // decode base64

        let partEmails = body.match(/<a href="mailto:([^"]*)">/g);
        if (partEmails) {
          partEmails = partEmails.map((email) => {
            var match = email.match(/mailto:([^"]*)">/);
            return match ? match[1] : null;
          });
          emails.push(...partEmails);
        }
      }
    }

    let OriginSender = emails[0];
    console.log("Initial Sender:", OriginSender);

    let emailData = message.data.payload.parts.filter(
      (part) => part.mimeType === "text/html"
    );

    if (emailData.length > 0) {
      let decodedEmail = Base64.decode(emailData[0].body.data);
      // console.log(decodedEmail);

      // Load the HTML content into cheerio
      const $ = cheerio.load(decodedEmail);

      // Define the CSS selector for the specific div element
      const QRcodeselector =
        'div[style="vertical-align:middle;display:inline-block;background:#ecedf1;border-radius:6px;font-family:Arial;font-size:16px;font-weight:bold;letter-spacing:0.5px;line-height:19px;text-align:center;text-transform:uppercase;padding:10px;color:#3e4e72"]';

      const VenueSelector =
        'p[style="font-family:korolev-condensed,Roboto,sans-serif;font-weight:700;font-size:16px"]';

      const TicketSelector =
        'div[style="color:#31c0f0;font-weight:700;font-size:16px;font-family:Arial,Helvetica,sans-serif;letter-spacing:normal;line-height:150%;font-stretch:normal"]';

      const CategorySelector =
        'div[style="color:#31c0f0;font-weight:700;font-size:18px;font-family:Arial,Helvetica,sans-serif;letter-spacing:normal;line-height:150%;font-stretch:normal"]';

      const PriceSelector =
        'div[style="color:#202226;font-weight:700;font-size:14px;font-family:Arial,Helvetica,sans-serif;letter-spacing:normal;line-height:150%"]';

      // Use cheerio to find the element matching the selector
      const extractedElement = $(QRcodeselector);
      const extractedVenueElement = $(VenueSelector);
      const extractedNoTicketElement = $(TicketSelector);
      const extractedCategoryElement = $(CategorySelector);
      const extractedPriceElement = $(PriceSelector).filter(':contains("₹")');

      console.log("/n");
      let QRCode;
      let Venue;
      let NoOfTickets;
      let Category;
      let Price;
      let extractedPriceText;
      let ticketText;

      // Check if an element is found
      if (extractedElement.length > 0) {
        // Extract the HTML content of the matched element
        QRCode = extractedElement.html().trim();
        console.log("QRCode: " + QRCode);
      } else {
        console.log("No matching element found.");
      }

      if (extractedVenueElement.length > 0) {
        // Extract the HTML content of the matched element
        Venue = extractedVenueElement.html().trim();
        console.log("Venue: " + Venue);
      } else {
        console.log("No matching element found.");
      }

      if (extractedNoTicketElement.length > 0) {
        ticketText = extractedNoTicketElement.html().trim();
        // Use regular expression to extract the number
        NoOfTickets = ticketText.match(/\d+/);

        console.log("NoOfTickets:" + NoOfTickets);
      } else {
        console.log("No matching element found.");
      }

      if (extractedCategoryElement.length > 0) {
        Category = extractedCategoryElement.html().trim();
        console.log("Category:" + Category);
      } else {
        console.log("No matching element found.");
      }

      if (extractedPriceElement.length > 0) {
        extractedPriceText = extractedPriceElement.html().trim();
        Price = extractedPriceText.match(/\d+/);
        console.log("Price: " + Price);
      } else {
        console.log("No matching element found.");
      }

      let fromAddress = message.data.payload.headers.find(
        (header) => header.name === "From"
      ).value;

      console.log("From: " + fromAddress);

      const Data = {
        Eventqrcode: QRCode,
        Eventname: Venue,
        Eventprice: Price[0],
        EventNoofticket: NoOfTickets[0],
        Eventcategory: Category,
        Fromaddress: fromAddress,
        Originaddress: OriginSender,
        Isverified: false,
        // Add other properties as needed
      };

      return Data;
    } else {
      console.log("No HTML part found in the latest email.");
    }
  } else {
    console.log("No emails found.");
  }

  return data;
};
