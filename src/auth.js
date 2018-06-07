let position = {
    mel: 5,
    dev: 4,
    admin: 3,
    tutor: 2,
    student: 1
}
var isLoggedIn = function (req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.url == "/login") return next();
    if (req.isAuthenticated()) {
        return next();
    }
    // if they aren't redirect them to the home page
    res.redirect('/login');
}
var authorizeStaff = function (user, permission) {
    if (!position[user.position]) return false;
    let userPosition = position[user.position]
    let pagePosition = position[permission]
    return userPosition >= pagePosition;
}
var authorizeStudent = function (user, permission, config) {
    if(!user.student) return false;
    if (!(user.student.status == 'active' || user.student.status == 'inactive')) return false;
    if (permission.status) {
        if (user.student.status != permission.status) return false;
    }
    if (permission.state) {
        if (permission.state == 'finished') {
            for (let i in user.student.quarter) {
                if (user.student.quarter[i].year == config.defaultQuarter.quarter.year
                    && user.student.quarter[i].quarter == config.defaultQuarter.quarter.quarter) {
                    return permission.state.includes(user.student.quarter[i].registrationState);
                }
            }
            return false
        }
        if (typeof permission.state == 'string') permission.state = [permission.state];
        if (permission.quarter) {
            if (permission.quarter == "summer" && config.defaultQuarter.registration.quarter < 11) return false;
        }
        for (let i in user.student.quarter) {
            if (user.student.quarter[i].year == config.defaultQuarter.registration.year
                && user.student.quarter[i].quarter == config.defaultQuarter.registration.quarter) {
                return permission.state.includes(user.student.quarter[i].registrationState);
            }
        }
        if(permission.state.includes("unregistered")) return true;
        return false
    }
    return true;
}

var authorize = function(user,side,permission,config){
    if(!user) return false;
    if(side == "staff") return authorizeStaff(user,permission);
    if(!config) return false;
    if(side == 'student') return authorizeStudent(user,permission,config);
    return false;
}

module.exports = {
    isLoggedIn: isLoggedIn,
    authorizeStudent: authorizeStudent,
    authorizeStaff: authorizeStaff,
    authorize: authorize
}