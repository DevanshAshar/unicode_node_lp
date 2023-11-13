const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});




const login = async(req, res)=>{
  try{
  const {email , password} = req.body;
  const user = await User.findOne({ email });

  
  
  console.log(user);
  if (!user) return res.status(401).send("User doesn't exist");
  const result = await bcrypt.compare(
    password,
    user.password,
    // (e, result) => {
    //   if (e) {
    //     return res.json({ Error: e.message });
    //   }
    //   return result;
    // }
    //linting
  );

  console.log(result);

  if (!result) return res.status(400).send("Incorrect password , try again");

  const authToken = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET , {expiresIn:"1d"}); //expires in

  //res.json("Successful login attempt , welcome back");

  res.status(200).json({
    "success" : "true",
    authToken,
  })

}
catch(err){
  return res.status(400).send(err.message);
}
};

const register = async(req, res)=>{
  const { name, email, password ,auth } = req.body;
  try {
    let user = await User.findOne({ email });

    if (user)
      return res.status(404).json({
        success: false,
        message: "User already exists",
      });

    const hashedPassword =  await bcrypt.hash(password, process.env.SALT);

    user = await User.create({ name, email, password: hashedPassword , auth});

    const authToken = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET ); //expires in

    let transporter = nodemailer.createTransport({
      service : "gmail",
     
      auth : {
        user : process.env.EMAIL,
        pass : process.env.PASSWORD
      }
    })
    
    const mailOptions = {
      from : process.env.EMAIL,
      to : req.body.email,
      subject : "Successful Registration",
      text : `Hi ${req.body.name}, you have successfully registered to our Quora Clone`
    }

    const info = await transporter.sendMail(mailOptions, function(err, data) {
      if(err) {
          console.log(err.message);
      } else {
          // console.log(data);
          console.log('Email sent successfully')
      }
  });

  // console.log(process.env.PASSWORD);
    res.json({
      success: true,
      message: "Successful registration and email sent",
      user,
      authToken,
      info
    });
  } catch (e) {
    res.status(400).json({ Error: e.message });
  }




};

const getMyProfile = async(req, res)=>{
  const user = await User.findOne({ _id: req.user });

  if (user) {
    res.status(200).json({
      success: true,
      user,
    });
  } else {
    res.status(404).send("User does not exist");
  }
};

const logout = async (req, res) => {
  res.send("hello");
};


const follow = async (req , res) =>{


    try{
    await User.findByIdAndUpdate(
      req.params.userId,
      {
        $push : {followers : req.user_id}
      }
    )
    }catch(err){
      return res.status(400).send("Followers of user couldn't be updated");
    }

    try{
      await User.findByIdAndUpdate(
        req_user,
        {
          $push : {following : req.params.id}
        }
      )
    }catch(err){
      return res.status(400).send("Following could not be updated properly");
    }

    res.status(201).json({
      success : true,
      message : "User followed successfully and following updated successfully",
      createdAnswer

  })
}


const unfollow = async (req , res) =>{



  try{
  await User.findByIdAndUpdate(
    req.params.userId,
    {
      $pull : {followers : req.user_id}
    }
  )
  }catch(err){
    return res.status(400).send("Followers of user couldn't be updated");
  }

  try{
    await User.findByIdAndUpdate(
      req_user,
      {
        $pull : {following : req.params.id}
      }
    )
  }catch(err){
    return res.status(400).send("Following could not be updated properly");
  }

  res.status(201).json({
    success : true,
    message : "User unfollowed successfully and following of user updated successfully",
    createdAnswer

})
}

const uploadpic = async (req, res) => {
  try {

    if(!req.files.profilepics){
      return res.status(400).send("Please select a file to upload");
    }


    const allowedext = /jpeg|jpg|png/

    for(const file of req.files.profilepics){
    const isExtOk = allowedext.test(path.extname(file.originalname).toLowerCase());

    const mimetype = allowedext.test(file.mimetype);


    if(!(isExtOk && mimetype)){
      return res.status(400).send("Please upload files with : jpg , jpeg , png extensions");
    }
    }

   
    
    const cloudinaryLink = [];

    for (const file of req.files.profilepics) {
      const result = await cloudinary.uploader.upload(file);
      cloudinaryLink.push(result.secure_url);
    }

    const user = await User.findByIdAndUpdate(req.user.user_id,
      {
      $set: {
        // profilePictureBuffer: profilePicBuffer,
        profilePictureCloudinary: cloudinaryLink 
      }
    },
    { new: true });
    

    res.status(200).json({
      success:'true',
       message: 'Profile picture(s) uploaded successfully', 
       user });
  } catch (err) {
    return res.status(500).send('File could not be uploaded properly');
  }
};


module.exports = {login , register , unfollow , follow , getMyProfile , logout , uploadpic};
