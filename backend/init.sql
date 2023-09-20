DROP TABLE IF EXISTS mindmap;
CREATE TABLE mindmap
(
    time datetime NOT NULL,
    json text NOT NULL,
    version CHAR(32) NOT NULL,
    parentVersion CHAR(32) NULL
);

DROP TABLE IF EXISTS notes;
CREATE TABLE notes
(
    id CHAR(32) NOT NULL,
    title CHAR(32) NOT NULL DEFAULT 'Undefined',
    path VARCHAR(128) NOT NULL,
    endpoint CHAR(128) NOT NULL
);