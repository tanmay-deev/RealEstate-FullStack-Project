import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';

//Register-------------------------------------------------
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verficationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isApproved: role === "seller" ? false : true,
      verficationToken,
    });

    try {
      await sendEmail({
        email,
        subject: "Verify Your Email - RealEstate Platform",
        message: `<p>Your email verification code is: <strong>${verficationToken}</strong></p><p>Please enter this code on the verification page to activate your account</p>`,
      });
    }
    
    catch (emailError) {
      console.error("Failed to send verification email: ", emailError);
      // still create user in database but not verified
      }
      
      res.status(201).json({
          message: "User Registered. Please check your email for the verification code",
          user: {
              email: user.email,
              name: user.name,
              role: user.role
          }
      });
  }
  
  catch (err) {
      res.status(500).json({
          message: err.message
      });
  }
};

// Login ------------------------------------------------
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password."
            })
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email or contact support"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        if (user.isBlocked) {
            return res.status(403).json({
                message: "Your account has been bolcked by admin. Please contact support."
            });
        }

        //token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.json({
            message: "Login Successful",
            token,
            user,
        });

    } catch (err) {
        res.status(500).json({
          message: err.message
      });
    }
}

// to get profile -------------------------------