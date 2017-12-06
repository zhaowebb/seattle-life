const{mongoose} = require('./db/mongoose.js')
const express = require('express')
const app = express()
const PORT = process.env.PORT || 3333
const {Restaurant} = require('./db/models/restaurant')
const mysql = require("mysql")
const deepcopy = require("deepcopy")
const radius = 0.05;

const findRestaurants = (lat, lng) => {
	return new Promise((resolve, reject) => {
		const restaurants = Restaurant.find({
		lat: {$gt: lat - radius, $lt: lat + radius},
		lng: {$gt: lng - radius, $lt: lng + radius},

		category: {$in: ["Restaurants"]}
	})
		if(restaurants){
			resolve(restaurants)
		}
		else{
			reject('unable to connect restaurants db')
		}
	})
	
}


const findHouses = (lat, lng, floorplan, isRent) => {
	return new Promise((resolve, reject) => {
		const con = mysql.createConnection({
			host: "seattle-housing.cx6oha6hvscj.us-east-2.rds.amazonaws.com",
			port: "3306",
			database: "seattle_housing",
			user: "cis550",
			password: "550project"
		})
		let houseTransaction = "Rent"
		if(isRent === 'false'){
			houseTransaction = "Sale"
		}

		let queryStatement = `
			SELECT * 
			FROM House
			JOIN ${houseTransaction}
			ON House.id = ${houseTransaction}.id
			WHERE House.lat BETWEEN ${lat - radius} AND ${lat + radius}
			AND House.lng BETWEEN ${lng - radius} AND ${lng + radius}
			AND House.floorplan = ${floorplan}
		`

		con.query(queryStatement, (err, response) => {
		if(err){
			reject("can't connect to house db")
		}
		else{
			resolve(response)
		}
		})
	})
}

const findUtilities = (lat, lng) => {
	return new Promise((resolve, reject) => {
		const con = mysql.createConnection({
		host: "seattle-housing.cx6oha6hvscj.us-east-2.rds.amazonaws.com",
		port: "3306",
		database: "seattle_housing",
		user: "cis550",
		password: "550project"
		})

		let queryStatement = `
			SELECT * 
			FROM Utility
			WHERE lat BETWEEN ${lat - radius} AND ${lat + radius}
			AND lng BETWEEN ${lng - radius} AND ${lng + radius}
		`

		con.query(queryStatement, (err, response) => {
		if(err){
			reject("can't connect to utility db")
		}
		else{
			resolve(response)
		}
		})
	})
}

const findCrimes = (lat, lng) => {
	return new Promise((resolve, reject) => {
		const con = mysql.createConnection({
		host: "seattle-housing.cx6oha6hvscj.us-east-2.rds.amazonaws.com",
		port: "3306",
		database: "seattle_housing",
		user: "cis550",
		password: "550project"
		})

		let queryStatement = `
			SELECT * 
			FROM Crime
			WHERE lat BETWEEN ${lat - radius} AND ${lat + radius}
			AND lng BETWEEN ${lng - radius} AND ${lng + radius}
			AND timing >= '2017-10-01'
		`

		con.query(queryStatement, (err, response) => {
		if(err){
			reject("can't connect to crime db")
		}
		else{
			resolve(response)
		}
		})
	})
}

app.get('/', (req, res) => {
	res.send("welcom to the app")
})

app.get('/:lat/:lng/:floorplan/:isRent', async (req, res) => {
	let lat = parseFloat(req.params.lat)
	let lng = parseFloat(req.params.lng)
	let floorplan = req.params.floorplan
	let isRent = req.params.isRent

	let restaurants = await findRestaurants(lat, lng)
	let houses = await findHouses(lat, lng, floorplan, isRent)
	let utilities = await findUtilities(lat, lng)
	let crimes = await findCrimes(lat, lng)

	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	
	res.send({crimes, houses, utilities, restaurants})
})



app.listen(PORT)
