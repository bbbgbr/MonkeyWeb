CREATE TABLE Users(
ID int PRIMARY KEY NOT NULL, -- 15999
Firstname NVARCHAR(64), -- 'สิรภพ'
Lastname NVARCHAR(64), -- 'สายสอาด'
Nickname NVARCHAR(64), -- 'แม๊ก'
FirstnameEn VARCHAR(64), -- 'Siraphop'
LastnameEn VARCHAR(64), -- 'Saisa-ard'
NicknameEn VARCHAR(64), -- 'Max'
Email VARCHAR(64), -- 'max@gmail.com'
Phone VARCHAR(16), -- '08xxxxxxxx'
UserStatus VARCHAR(32) NOT NULL, -- 'active'
Position VARCHAR(32) NOT NULL, -- 'tutors'
SubPosition VARCHAR(64) -- 'Admin'
)