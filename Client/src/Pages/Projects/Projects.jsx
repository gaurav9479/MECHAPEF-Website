import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';
import ModelViewer from '../../components/ModelViewer/ModelViewer';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects/active');
        setProjects(res.data.data?.projects || []);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="projects-page-wrapper">
      <Helmet>
        <title>Projects & Showcases | MechaPEF</title>
      </Helmet>

      <div className="projects-header">
        <h1>Engineering <span className="highlight-text">Showcase</span></h1>
        <p>Explore our cutting-edge SolidWorks and ANSYS models in interactive 3D.</p>
      </div>

      <div className="projects-container">
        {loading ? (
          <div className="projects-loading">
            <div className="spinner"></div>
            <p>Loading models...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="projects-empty">
            <h3>No projects available at the moment.</h3>
            <p>Check back soon for amazing 3D engineering models!</p>
          </div>
        ) : (
          projects.map((project, index) => (
            <div 
              key={project._id} 
              className={`project-card ${index % 2 !== 0 ? 'project-card-reverse' : ''}`}
            >
              <div className="project-3d-wrapper">
                <ModelViewer 
                  src={project.modelUrl} 
                  alt={project.title} 
                />
              </div>
              <div className="project-info">
                <h2>{project.title}</h2>
                <div className="project-desc">
                  {project.description.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                {project.credits && (
                  <div className="project-credits">
                    <strong>Credits:</strong> {project.credits}
                  </div>
                )}
                <div className="interaction-hint">
                  <span className="hint-icon">🖱️</span>
                  Drag to rotate • Scroll to zoom
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Projects;
