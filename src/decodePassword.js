const CryptoJS = require('crypto-js')

for(let i = 1000 ; i <10000 ; i++){
	if(CryptoJS.SHA3(''+i).toString() == "d474294ce052cfdd6279d7a816acaeef991fb386513dd973e2b80d7fa6e2bec03053b31244ef1e7402004c5544c4d19e595966e4b3f0fc9740c058dc26c96689"){
		console.log(i)
	}
}