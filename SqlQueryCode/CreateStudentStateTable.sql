CREATE TABLE StudentState(
    ID INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    Grade TINYINT NOT NULL, -- 6
    StudentLevel VARCHAR(2), -- 'a'
    Quarter INT NOT NULL FOREIGN KEY REFERENCES Quarter(ID),
    StudentID INT NOT NULL FOREIGN KEY REFERENCES Users(ID),
    Stage VARCHAR(32) NOT NULL, -- 'registered'
    Remark VARCHAR(32) -- '1','2',etc.
)