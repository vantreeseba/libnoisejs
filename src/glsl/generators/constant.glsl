// Description : Returns a constant value. 
//      Author : Ben Van Treese 
//  Maintainer : vantreeseba 
//     Lastmod : 05-12-2017 
//     License : Distributed under the MIT License. See LICENSE file.

vec3 constant(float value) {
  return vec3(value);
}

#pragma glslify: export(constant);
