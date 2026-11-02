import React from 'react';
import {
  HeartPulse,
  GraduationCap,
  Briefcase,
  Sprout,
  Droplets,
  Home,
  Users,
  ShieldCheck,
  Accessibility,
  Coins,
  Building2,
  Award,
  Tractor,
  BookOpen,
  FolderOpen,
} from 'lucide-react';

/**
 * Returns a corresponding icon for each government scheme category
 */
export const CategoryIcon = ({ category, className = 'w-6 h-6' }) => {
  const norm = (category || '').toLowerCase();

  if (norm.includes('health') || norm.includes('medical')) {
    return <HeartPulse className={className} />;
  }
  if (norm.includes('irrigation') || norm.includes('water')) {
    return <Droplets className={className} />;
  }
  if (norm.includes('farmer') || norm.includes('kisan')) {
    return <Tractor className={className} />;
  }
  if (norm.includes('agri')) {
    return <Sprout className={className} />;
  }
  if (norm.includes('student')) {
    return <BookOpen className={className} />;
  }
  if (norm.includes('education') || norm.includes('scholarship')) {
    return <GraduationCap className={className} />;
  }
  if (norm.includes('employ') || norm.includes('job') || norm.includes('wage')) {
    return <Briefcase className={className} />;
  }
  if (norm.includes('house') || norm.includes('housing') || norm.includes('awas')) {
    return <Home className={className} />;
  }
  if (norm.includes('women') || norm.includes('child')) {
    return <Users className={className} />;
  }
  if (norm.includes('senior') || norm.includes('elder') || norm.includes('pension')) {
    return <ShieldCheck className={className} />;
  }
  if (norm.includes('disab') || norm.includes('divyang')) {
    return <Accessibility className={className} />;
  }
  if (norm.includes('finan') || norm.includes('money') || norm.includes('credit')) {
    return <Coins className={className} />;
  }
  if (norm.includes('msme') || norm.includes('business') || norm.includes('mudra')) {
    return <Building2 className={className} />;
  }
  if (norm.includes('skill') || norm.includes('training')) {
    return <Award className={className} />;
  }

  return <FolderOpen className={className} />;
};

export default CategoryIcon;
