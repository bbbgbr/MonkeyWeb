CREATE TABLE Attendance (
    ID INT PRIMARY KEY NOT NULL IDENTITY(1,1),
    AttendanceTimestamp DATETIME2 NOT NULL DEFAULT(GETDATE()),
    StudentID INT NOT NULL FOREIGN KEY REFERENCES Users(ID), -- 15999
    ClassID INT NOT NULL FOREIGN KEY REFERENCES Class(ID),
    AttendanceDate DATE NOT NULL, -- 2018-06-28
    AttendanceType VARCHAR(7) NOT NULL, -- 'absent','present'
    Reason NVARCHAR(MAX), -- 'go to travel'
    Remark VARCHAR(2), -- '1','2',etc.
    Sender NVARCHAR(64), -- 'Mom'
    AttendanceDocument VARCHAR(128)
)