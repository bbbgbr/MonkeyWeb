CREATE TABLE HybridSheet (
    ID INT PRIMARY KEY NOT NULL IDENTITY(1,1),
    TopicID INT NOT NULL FOREIGN KEY REFERENCES Topic(ID),
    SheetLevel CHAR(1) NOT NULL, -- B,I,E
    SheetNumber NUMERIC(2,0) NOT NULL, -- 01,02
    SubLevel VARCHAR(2), -- a,b,c
    Rev NUMERIC(1,1), -- 1.1,2.0
    SheetPath VARCHAR(128) NOT NULL -- '/MATH_DB/...'
)