/** Add projects here. The empty array shows the intentional coming-soon grid.
 * image is an optional public path; href is an optional project/repository URL.
 */
export type Project = {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  tags: string[];
  image?: string;
  href?: string;
};

export const projects: Project[] = [];
