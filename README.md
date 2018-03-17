# MONKEY WEB
This site is for using in [Monkey](https://monkey-monkey.com)

## Getting Started
### Prerequisite
1. MongoDB
2. Node.js
3. npm

**Note:**
This website use:
- `express` as the request handeler
- `mongo` as database
- `pug` for templating


### Installing
1. Clone project
2. Run `npm install` to download library ising in this project
3. Start project using `npm start` (require `nodemon` install globaly in node environment)

## Add new web page
To add new page add the following code in `webflow.js` or the corresponding file.
```javascript
app.get('/yourLink', [middleWareOptions], function(req, res) {
	// Do some magic here
	
	// For rendering pug page use the following code
	return res.status(200).render('YourPageName', {
		renderingOptions
	});
});
```
**Note:** For more response type please visit [Express](https://expressjs.com/en/4x/api.html)

## Post method
---
### Phase II (V1) current version

#### Course
- `post/v1/allCourse` get course data.
	- *req* `{year, quarter}`
	- *return* `{courseID, courseName, day, tutorName, studentCount, room, grade}`

#### Quarter
- `post/v1/listQuarter` get all quarter.
	- *req* `{status[option]}` "public", "private", "protect"
	- *return* `[{year, quarter, name, quarterID, status, maxSeat, week}]`

#### QR
- `post/v1/requestQR` get String for generate QR code.
	- *req* `{subject, ageGroup, level, difficulty, number, rev, subRev, alternative[option], supplement[option]}`
	- *return* `{hw, skill, test, hot}`

#### Quota
- The following function use to modify and view quota of the student who absent

- addQuota
	
	This function is use to add the modifier to student either plus or minus
	- request path `/post/v1/addQuota`
	- request body
		```javascript
		req.body = {
			studentID: 15999,
			subject: 'M',
			value: 1,
			quarterID: 201701 /* Optional quarter id to specify quarter to add quota */
		}
		```
	- response body
		```javascript
		res.body = {
			msg: 'OK'
		}
		```
- deleteQuota

	This function is use to delete quota transaction

	**Note:** This is destructive function and should not be use. This function will delete the history of adding quota
	- request path `/post/v1/deleteQuota`
	- request body
		```javascript
		req.body = {
			quotaID: 'w4y7napqv5w4founvc35q4d'
		}
		```
	- response body
		```javascript
		res.body = {
			msg: 'OK'
		}
		```
- listQuota

	This function is use to list specific quota
	- request path `/post/v1/listQuota`
	- request body
		```javascript
		req.body = {
			studentID: 15999,
			quarterID: 201701 /* Optional quarter id to specify quarter to add quota */
		}
		```
	- response body
		```javascript
		res.body = {
			quotaCount: [
				{
					_id: 'M', /* Subject code */
					value: 1
				}, ...
			]
		}
		```

#### DeviceToken
- This function is use for register iOS device to recieve notification

- RegisteriOSDeviceToken

	This function is use to add token and specify user who own that token
	- request path `/post/v1/registeriOSDeviceToken`
	- request body
		```javascript
		req.body = {
			id: 99000,
			token: '3w4mo7hmrwa48vhrawpjcrmpwpvau3crw34r'
		}
		```
	- response body
		```javascript
		res.body = {
			msg: 'OK'
		}
		```

### Phase III (V2) (universal platform development API)

#### Task
- Function using to modify about task.
- This API need authentication with username and password through `/post/v1/login` and also use authorization of `tutor or above`
- There are 7 possible status of the task node
	- none			-> State that the task is in unknown state
	- note			-> State that the task is in note state which is the initial state of create task
	- todo			-> State that the task is in todo state the state where task is assigned to the others will be sent
	- inprogress	-> State that the task is in working process
	- assign		-> State that the task is assigned to the others 
	- done			-> State that the assigned task is done
	- complete		-> State that all of the task is done

- addTask

	This function use to add as task to the database by creating 2 object head node and non-head node.
	- Head Node
		Contain information about task which cannot be change.
	- Non-head Node
		Contain information which can be change all the way which task is assign or change state.

	- request path `/v2/addTask`
	- request body
		```javascript
		req.body = {
			title: 'Hello World',
			detail: 'Your task detail here',
			subtitle: 'Subtitle of the task'
		}
		```
	- response body
		```javascript
		res.body = {
			msg: 'OK'
		}
		```

- deleteTask

	This function is use for deleting the whole task, only head task can be send into this function

	- request path `/v2/deleteTask`
	- request body
		```javascript
		req.body = {
			taskID: 'u24q09nf78aybepq8n9w4mavufbsvyes5'
		}
		```
	- response body
		if not error
		```javascript
		res.body = {
			msg: 'OK'
		}
		```

		if error
		```javascript
		res.body = {
			err: 0, /* error number */
			msg: 'Error Detail'
		}
		```

- editHeaderTask
	This function is use for wdit the title of the task, only head task can be send into this function

	



### Phase I
~~Under construction.~~
## TODO
~~Under construction.~~
