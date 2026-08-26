import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLinkedin, FaInstagram, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

const TeamMemberModal = ({ member, onClose }) => {
  if (!member) return null;

  const categoryLabel = 
    member.category === 'team_ty' ? 'Final Year Senior' :
    member.category === 'team_al' ? 'Notable Alumni' :
    member.category === 'team_sy' ? 'Pre-Final Member' :
    member.category === 'team_fy' ? 'Second Year Member' : 'Team Member';

  const linkedinUrl = member.linkedinURL?.trim();
  const instagramUrl = member.instagramURL?.trim();

  return (
    <AnimatePresence>
      <div 
        className="member-modal-backdrop" 
        onClick={onClose}
      >
        <motion.div 
          className="member-modal-card"
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="member-modal-close" onClick={onClose} aria-label="Close modal">
            <FaTimes />
          </button>

          <div className="member-modal-avatar-wrapper">
            <img 
              src={getOptimizedImageUrl(member.url || member.imageURL)} 
              alt={member.name || 'Member Avatar'} 
              className="member-modal-avatar"
            />
          </div>

          <div className="member-modal-badge">
            {categoryLabel}
          </div>

          <h2 className="member-modal-name">{member.name || 'Team Member'}</h2>
          <p className="member-modal-role">{member.regNo || member.fallbackRole || 'Senior Coordinator'}</p>

          <div className="member-modal-socials">
            {linkedinUrl ? (
              <a 
                href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-btn linkedin"
              >
                <FaLinkedin size={20} />
                <span>LinkedIn</span>
                <FaExternalLinkAlt size={12} style={{ opacity: 0.7 }} />
              </a>
            ) : (
              <span className="social-btn disabled">
                <FaLinkedin size={20} />
                <span>No LinkedIn</span>
              </span>
            )}

            {instagramUrl ? (
              <a 
                href={instagramUrl.startsWith('http') ? instagramUrl : `https://${instagramUrl}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-btn instagram"
              >
                <FaInstagram size={20} />
                <span>Instagram</span>
                <FaExternalLinkAlt size={12} style={{ opacity: 0.7 }} />
              </a>
            ) : (
              <span className="social-btn disabled">
                <FaInstagram size={20} />
                <span>No Instagram</span>
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TeamMemberModal;
