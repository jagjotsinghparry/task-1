# AI Resume Validator

## Structure and Flow
A very simple DB structure is there to take in basic details:

- Full Name
- Phone Number
- Skills(comma separated values)
- Experience in years
- Resume/CV PDF file

This information is saved along with the file and a validation is triggered at the backend. The file along with the details is sent to n8n which in turn calls a workflow which parses the PDF and compares the details submitted by the user. The answer from n8n is stored in DB and status for the submitted file is updated. 

According to the status, the UI shows the information. To save this information in DB the structure is as follows:

- validationStatus - ENUM
- mismatchedFields - JSON

JSON field allows us to store dynamic information and make it parseable for the frontend.

## Running

`docker compose up --build`

Open `http://localhost:5678` and insert the workflow "CV Comparison.json". You'll need to add a Gemini API key.

Run the project at `http://localhost:3000/form`