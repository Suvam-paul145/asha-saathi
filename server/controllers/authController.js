const User = require("../models/User")
const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken");


exports.register = async (req, res) => {
  try {
    console.log("Register request body:", req.body);

    const { username, email, password } = req.body;

    // Server-side strong password validation
    const passwordErrors = [];
    if (!password || password.length < 8) passwordErrors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) passwordErrors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) passwordErrors.push("one lowercase letter");
    if (!/[0-9]/.test(password)) passwordErrors.push("one number");
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) passwordErrors.push("one special character");
    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: `Password must contain: ${passwordErrors.join(", ")}` });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists");
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    console.log("New user created:", newUser);

    res.status(201).json({ message: "User registered", user: newUser });
  } catch (err) {
    console.error(" Registration error:", err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
};


exports.login = async(req,res)=>{
    const {email,password} = req.body;
    try{
        const user = await User.findOne({email});
        if(!user) return res.status(404).json({message:"User doesn't exist"})
        const matchuser = await bcryptjs.compare(password,user.password)
        if(!matchuser) return res.status(401).json({message:"Invalid Credentials"});

        const token = jwt.sign({userId:user._id,username:user.username},process.env.JWT_SECRET,{
            expiresIn : "2h",
        });
        res.json({message:"Login successful",token,username:user.username})
    }catch(err){
        res.status(500).json({message:"Login Failed"})
    }
};

