CREATE TABLE Quarter(
    ID INT PRIMARY KEY NOT NULL,
    QuarterName VARCHAR(32) NOT NULL, -- 'CR61Q1'
    QuarterType VARCHAR(32) NOT NULL, -- 'summer','normal'
    StartDate DATE, -- 2018-5-22
    EndDate DATE -- 2018-7-25
)