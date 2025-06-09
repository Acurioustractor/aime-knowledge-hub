#!/usr/bin/env python3
"""
Script to add test documents to Airtable for testing the indexer.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from pyairtable import Api

# Load environment variables
load_dotenv()

def add_test_themes():
    """Add test themes to the Themes table."""
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    base_id = os.getenv('AIRTABLE_BASE_ID')
    themes_table = api.table(base_id, 'Themes')
    
    test_themes = [
        {'Name': 'AI Safety', 'Description': 'Research and practices related to ensuring AI systems are safe and beneficial'},
        {'Name': 'Research', 'Description': 'Academic and scientific research activities'},
        {'Name': 'Policy', 'Description': 'Government policies and regulations related to AI'},
        {'Name': 'Mathematics', 'Description': 'Mathematical foundations and theoretical concepts'},
        {'Name': 'Machine Learning', 'Description': 'Algorithms and techniques for machine learning'},
        {'Name': 'Theory', 'Description': 'Theoretical frameworks and concepts'},
        {'Name': 'Ethics', 'Description': 'Ethical considerations in AI development and deployment'},
        {'Name': 'AI Development', 'Description': 'Practical aspects of developing AI systems'},
        {'Name': 'Best Practices', 'Description': 'Recommended approaches and methodologies'}
    ]
    
    for theme in test_themes:
        try:
            record = themes_table.create(theme)
            print(f"✅ Added theme: {theme['Name']}")
        except Exception as e:
            print(f"⚠️  Theme {theme['Name']} may already exist: {e}")

def add_test_documents():
    """Add some test documents to Airtable."""
    
    # Initialize Airtable
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    base_id = os.getenv('AIRTABLE_BASE_ID')
    table = api.table(base_id, 'Documents')
    
    # Test documents (without Topics field for now)
    test_docs = [
        {
            'Title': '2024 AI Safety Report',
            'Author': 'AIME Research Team',
            'Date': '2024-01-15',
            'Full Text': '''This comprehensive report examines the current state of AI safety research and provides recommendations for future development.

Executive Summary:
The field of AI safety has made significant progress in 2024, with new alignment techniques and safety protocols being developed across major research institutions. However, several challenges remain, particularly in the areas of interpretability and robustness.

Key Findings:
1. Constitutional AI approaches have shown promise in reducing harmful outputs
2. Mechanistic interpretability research has advanced understanding of transformer architectures
3. Red team exercises have revealed new categories of AI risks
4. International cooperation on AI governance has increased significantly

Recommendations:
- Increase funding for AI safety research
- Develop standardized evaluation protocols
- Establish international AI safety standards
- Create more public-private partnerships in AI safety

The report concludes that while progress has been made, continued vigilance and research investment are essential for ensuring AI systems remain beneficial and aligned with human values.''',
            'Status': 'New'
        },
        {
            'Title': 'Mathematical Foundations of Machine Learning',
            'Author': 'Dr. Sarah Chen',
            'Date': '2024-02-20',
            'Full Text': '''This document provides a comprehensive overview of the mathematical foundations underlying modern machine learning algorithms.

Chapter 1: Linear Algebra Foundations
Vector spaces, eigenvalues, and matrix decompositions form the backbone of many ML algorithms. Understanding these concepts is crucial for developing intuition about how models work.

Chapter 2: Probability Theory
Bayesian inference, maximum likelihood estimation, and probabilistic graphical models are essential tools in the ML practitioner's toolkit.

Chapter 3: Optimization Theory
Gradient descent, convex optimization, and constrained optimization problems are fundamental to training machine learning models.

Chapter 4: Information Theory
Entropy, mutual information, and the principle of maximum entropy provide theoretical frameworks for understanding learning and generalization.

Applications:
- Neural network training relies heavily on optimization theory
- Bayesian methods use probability theory for uncertainty quantification
- Dimensionality reduction techniques leverage linear algebra
- Regularization techniques are grounded in optimization and information theory''',
            'Status': 'New'
        },
        {
            'Title': 'Ethics in AI Development - Best Practices Guide',
            'Author': 'Ethics Committee',
            'Date': '2024-03-10',
            'Full Text': '''This guide outlines best practices for incorporating ethical considerations into AI development workflows.

Core Principles:
1. Fairness and Non-discrimination
2. Transparency and Explainability
3. Privacy and Data Protection
4. Human Agency and Oversight
5. Robustness and Safety

Implementation Framework:

Design Phase:
- Conduct stakeholder analysis
- Identify potential biases in data and algorithms
- Establish fairness metrics and constraints
- Design for interpretability from the start

Development Phase:
- Implement privacy-preserving techniques
- Regular bias testing and mitigation
- Documentation of design decisions
- Code review with ethics focus

Deployment Phase:
- Gradual rollout with monitoring
- Feedback loops for continuous improvement
- Regular audits and assessments
- Clear channels for reporting issues

Case Studies:
- Hiring algorithm bias detection and mitigation
- Medical AI fairness across demographic groups
- Recommendation system filter bubble prevention
- Autonomous vehicle ethical decision-making

This framework should be adapted to specific use cases and organizational contexts while maintaining adherence to core ethical principles.''',
            'Status': 'New'
        }
    ]
    
    # Add documents to Airtable
    for doc in test_docs:
        try:
            record = table.create(doc)
            print(f"✅ Added: {doc['Title']} (ID: {record['id']})")
        except Exception as e:
            print(f"❌ Error adding {doc['Title']}: {e}")
    
    print(f"\n🎉 Added {len(test_docs)} test documents to Airtable!")
    print("You can now run the indexer to process these documents.")

if __name__ == "__main__":
    print("Setting up test data in Airtable...")
    print("\n1. Adding themes...")
    add_test_themes()
    print("\n2. Adding test documents...")
    add_test_documents()
    print("\n✨ Setup complete! Ready to test the indexer.") 