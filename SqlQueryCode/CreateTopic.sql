CREATE TABLE Topic (
    ID INT PRIMARY KEY NOT NULL IDENTITY(1,1),
    TopicSubject CHAR(1) NOT NULL, -- M,P
    Class CHAR(1) NOT NULL, -- J,H
    Topic VARCHAR(5) NOT NULL, -- XEL,XSS
    TopicName NVARCHAR(64) -- Sequence & Series
)