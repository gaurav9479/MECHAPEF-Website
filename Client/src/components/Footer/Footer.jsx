import React, { useState } from 'react';
import { motion } from "framer-motion";
import { FaInstagram, FaLinkedinIn, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import api from '../../services/api';
import "./Footer.css";

const Footer = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Sending...');
    try {
      const res = await api.post('/contact/submit', formData);
      setStatus(res.data?.message || 'Message sent successfully!');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus(''), 4000);
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        {/* Contact Form Side */}
        <motion.div 
          className="footer-left"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="footer-title">GET IN <span className="highlight-text">TOUCH</span></h2>
          <p className="footer-subtitle">Have an idea, project, or just want to collaborate? Send us a message.</p>
          
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input type="text" name="name" placeholder="Your Name" required value={formData.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <input type="email" name="email" placeholder="Your Email" required value={formData.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <textarea name="message" placeholder="Your Message" rows="4" required value={formData.message} onChange={handleChange}></textarea>
            </div>
            <button type="submit" className="primary-btn submit-btn">SEND MESSAGE</button>
            {status && <p className="form-status">{status}</p>}
          </form>
        </motion.div>

        {/* Socials & Info Side */}
        <motion.div 
          className="footer-right"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="footer-info">
            <h3>Contact Information</h3>
            <div className="info-item">
              <FaMapMarkerAlt className="info-icon" />
              <p>MNNIT Allahabad, Prayagraj, UP 211004</p>
            </div>
            <div className="info-item">
              <FaEnvelope className="info-icon" />
              <p>mechapef@mnnit.ac.in</p>
            </div>
            <div className="info-item">
              <FaPhoneAlt className="info-icon" />
              <p>+91 98765 43210</p>
            </div>
          </div>

          <div className="footer-socials">
            <h3>Follow Our Journey</h3>
            <div className="social-icons">
              <a href="https://www.instagram.com/mechapef_mnnit/" className="social-link" target="_blank" rel="noreferrer"><FaInstagram /></a>
              <a href="https://www.linkedin.com/company/mechapef-mnnit" className="social-link" target="_blank" rel="noreferrer"><FaLinkedinIn /></a>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} MechaPEF. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;