-- Pokreni ako već imaš staru bazu bez team_id na users.
USE basketball_project;

-- Ako teams tabela ne postoji pre users, prvo kreiraj teams ili ukloni FK ispod.

ALTER TABLE users
    ADD COLUMN team_id INT NULL AFTER email;

ALTER TABLE users
    ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams (team_id) ON DELETE SET NULL;
